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