package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const (
	// maxPDFSize bounds the upload independently of Fiber's global BodyLimit.
	maxPDFSize = 50 * 1024 * 1024
	// maxRules bounds work handed to the Python sidecar.
	maxRules = 50
)

// sanitizeFilename strips any directory component and characters that would
// let a crafted upload name escape the temp dir or inject response headers.
func sanitizeFilename(name string) string {
	name = filepath.Base(strings.ReplaceAll(name, "\\", "/"))
	name = strings.Map(func(r rune) rune {
		if r < 32 || r == 127 || r == '"' {
			return -1
		}
		return r
	}, name)
	name = strings.TrimSpace(strings.Trim(name, "."))
	if name == "" || name == "." || name == ".." {
		return "document.pdf"
	}
	if len(name) > 128 {
		name = name[len(name)-128:]
	}
	return name
}

// replacementRule mirrors one entry of the rules payload for validation.
type replacementRule struct {
	Find      string `json:"find"`
	Replace   string `json:"replace"`
	MatchCase bool   `json:"match_case"`
}

// validateRules rejects malformed payloads before spawning the Python process.
func validateRules(raw string) ([]replacementRule, error) {
	var rules []replacementRule
	if err := json.Unmarshal([]byte(raw), &rules); err != nil {
		return nil, fmt.Errorf("replacement rules must be a JSON array of {find, replace} objects")
	}
	if len(rules) > maxRules {
		return nil, fmt.Errorf("too many replacement rules (max %d)", maxRules)
	}
	usable := rules[:0]
	for _, r := range rules {
		if strings.TrimSpace(r.Find) != "" {
			usable = append(usable, r)
		}
	}
	if len(usable) == 0 {
		return nil, fmt.Errorf("provide at least one non-empty 'find' value")
	}
	return usable, nil
}

// hasPDFMagic verifies real PDF bytes rather than trusting the file extension.
func hasPDFMagic(path string) bool {
	f, err := os.Open(path)
	if err != nil {
		return false
	}
	defer f.Close()
	header := make([]byte, 1024)
	n, _ := f.Read(header)
	return bytes.Contains(header[:n], []byte("%PDF-"))
}

type ReplaceResult struct {
	Status            string `json:"status"`
	TotalReplacements int    `json:"total_replacements"`
	PagesModified     []int  `json:"pages_modified"`
	Error             string `json:"error,omitempty"`
}

// ReplaceTextHandler handles POST /api/pdf/replace-text
func ReplaceTextHandler(c *fiber.Ctx) error {
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Failed to parse form: " + err.Error()})
	}

	files := form.File["file"]
	if len(files) == 0 {
		files = form.File["files"]
	}
	if len(files) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No PDF file provided"})
	}

	file := files[0]
	if strings.ToLower(filepath.Ext(file.Filename)) != ".pdf" {
		return c.Status(400).JSON(fiber.Map{"error": "File must be a PDF document (.pdf)"})
	}
	if file.Size == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "The uploaded PDF is empty"})
	}
	if file.Size > maxPDFSize {
		return c.Status(413).JSON(fiber.Map{
			"error": fmt.Sprintf("PDF is too large (max %d MB)", maxPDFSize/(1024*1024)),
		})
	}
	safeName := sanitizeFilename(file.Filename)

	// Read replacement rules
	rulesStr := c.FormValue("rules")
	if rulesStr == "" && len(form.Value["rules"]) > 0 {
		rulesStr = form.Value["rules"][0]
	}
	if rulesStr == "" {
		// Fallback: Check for single find/replace form fields
		findVal := c.FormValue("find")
		replaceVal := c.FormValue("replace")
		matchCase := c.FormValue("match_case") == "true"
		if findVal != "" {
			rulesBytes, _ := json.Marshal([]map[string]interface{}{
				{
					"find":       findVal,
					"replace":    replaceVal,
					"match_case": matchCase,
				},
			})
			rulesStr = string(rulesBytes)
		} else {
			return c.Status(400).JSON(fiber.Map{"error": "No replacement rules provided (specify 'rules' JSON or 'find'/'replace')"})
		}
	}

	if _, err := validateRules(rulesStr); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	sessionID := uuid.New().String()
	uploadPath := filepath.Join("temp_uploads", sessionID)
	if err := os.MkdirAll(uploadPath, os.ModePerm); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create upload directory"})
	}
	defer os.RemoveAll(uploadPath)

	inputPDFPath := filepath.Join(uploadPath, safeName)
	if err := c.SaveFile(file, inputPDFPath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save uploaded PDF"})
	}

	if !hasPDFMagic(inputPDFPath) {
		return c.Status(400).JSON(fiber.Map{
			"error": "That file is not a valid PDF (missing PDF signature).",
		})
	}

	rulesFilePath := filepath.Join(uploadPath, "rules.json")
	if err := os.WriteFile(rulesFilePath, []byte(rulesStr), 0644); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to write rules file"})
	}

	outputPath := filepath.Join("temp_outputs", sessionID+".pdf")
	defer os.Remove(outputPath)

	// Execute Python script
	outputBytes, err := ExecuteWithTimeoutOutput(
		"converters/scripts/replace_text_pdf.py",
		inputPDFPath,
		outputPath,
		rulesFilePath,
	)

	if err != nil {
		errMsg := "PDF text replacement failed"
		if jsonErr := lastJSONLine(outputBytes); jsonErr != nil {
			var errObj struct {
				Error string `json:"error"`
			}
			if err := json.Unmarshal(jsonErr, &errObj); err == nil && errObj.Error != "" {
				errMsg = errObj.Error
			}
		}
		return c.Status(400).JSON(fiber.Map{
			"error": errMsg,
		})
	}

	// Parse replacement stats from python output. CombinedOutput may carry
	// interpreter or MuPDF chatter, so decode the last JSON object it printed.
	var result ReplaceResult
	if jsonLine := lastJSONLine(outputBytes); jsonLine != nil {
		_ = json.Unmarshal(jsonLine, &result)
	}

	// If S3 is configured
	if BucketName != "" {
		s3Url, err := UploadToS3(outputPath, "edited-"+sessionID+".pdf")
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to upload to S3: " + err.Error()})
		}
		return c.JSON(fiber.Map{
			"message":            "success",
			"url":                s3Url,
			"total_replacements": result.TotalReplacements,
			"pages_modified":     result.PagesModified,
		})
	}

	// Expose response headers for client to read stats
	c.Set("Access-Control-Expose-Headers", "X-Total-Replacements, X-Pages-Modified, Content-Disposition")
	c.Set("X-Total-Replacements", fmt.Sprintf("%d", result.TotalReplacements))

	// Must be valid JSON: the client parses this header with JSON.parse.
	pagesJSON, err := json.Marshal(result.PagesModified)
	if err != nil || result.PagesModified == nil {
		pagesJSON = []byte("[]")
	}
	c.Set("X-Pages-Modified", string(pagesJSON))
	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"edited_%s\"", file.Filename))

	return c.SendFile(outputPath)
}

// lastJSONLine returns the last line of output that looks like a JSON object,
// so stray stdout/stderr chatter cannot corrupt stats decoding.
func lastJSONLine(out []byte) []byte {
	lines := strings.Split(string(out), "\n")
	for i := len(lines) - 1; i >= 0; i-- {
		line := strings.TrimSpace(lines[i])
		if strings.HasPrefix(line, "{") && strings.HasSuffix(line, "}") {
			return []byte(line)
		}
	}
	return nil
}
