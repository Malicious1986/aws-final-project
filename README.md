# Final Project App

## Deploy Lambdas

Deploy the AWS Lambda functions from the `lambdas/` folder with the AWS CLI:

```bash
npm run deploy:lambdas
```

The command will:

1. Install production dependencies in each lambda folder with `npm ci --omit=dev`.
2. Create a temporary zip archive for each function.
3. Look up the AWS Lambda function name in `lambda-deploy.config.json`.
4. Call `aws lambda update-function-code` for each lambda folder it finds.

If you want to deploy only specific functions, pass their folder names after `--`:

```bash
npm run deploy:lambdas -- add-record get-records
```

Requirements:

1. `aws` must be installed and configured with credentials that can update Lambda functions.
2. `zip` must be available in your shell.
3. Update [lambda-deploy.config.json](lambda-deploy.config.json) if your AWS Lambda function names differ from the folder names.

## GitHub Actions PR Deploy

The workflow in [.github/workflows/pr-deploy.yml](.github/workflows/pr-deploy.yml) runs when a pull request is opened from the same repository. It:

1. Builds the Docker image from [Dockerfile](Dockerfile).
2. Pushes the image to ECR with both a PR tag and `latest`.
3. Forces an ECS service redeploy so the service picks up the updated image.
4. Runs `npm run deploy:lambdas` to publish both Lambda functions.

Required repository variables:

1. `AWS_REGION`
2. `AWS_ROLE_TO_ASSUME`
3. `ECR_REPOSITORY`
4. `ECS_CLUSTER`
5. `ECS_SERVICE`
6. `VITE_API_URL`

Set `ECR_REPOSITORY` to `final/project` to match the image path you are tagging and pushing manually, and keep `VITE_API_URL` aligned with the API URL passed to `docker build`.

The ECS service should use a mutable image tag such as `latest`, because the workflow triggers a fresh deployment rather than registering a new task definition revision.