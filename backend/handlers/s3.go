package handlers

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var S3Client *s3.Client
var BucketName string

// InitS3 initializes the AWS S3 client using environment variables
func InitS3() error {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		return fmt.Errorf("unable to load SDK config: %v", err)
	}

	S3Client = s3.NewFromConfig(cfg)
	BucketName = os.Getenv("AWS_S3_BUCKET")
	if BucketName == "" {
		fmt.Println("Warning: AWS_S3_BUCKET environment variable is not set. S3 Uploads are disabled.")
	} else {
		fmt.Printf("S3 Initialized. Bucket: %s\n", BucketName)
	}

	return nil
}

// UploadToS3 uploads a local file to S3 and returns the public URL
func UploadToS3(filePath string, objectKey string) (string, error) {
	if S3Client == nil || BucketName == "" {
		return "", fmt.Errorf("S3 client not initialized or bucket not set")
	}

	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file %q: %v", filePath, err)
	}
	defer file.Close()

	_, err = S3Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(BucketName),
		Key:    aws.String(objectKey),
		Body:   file,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file to S3: %v", err)
	}

	// Generate the public S3 URL
	s3Url := fmt.Sprintf("https://%s.s3.amazonaws.com/%s", BucketName, objectKey)
	return s3Url, nil
}
