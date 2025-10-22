#!/bin/bash
# Train models on Railway using a one-time command

echo "🎯 Training ML models on Railway..."
echo "This will execute Python directly on Railway's infrastructure."
echo ""

# Use railway up to deploy and run the training script
cd packages/ml-service
railway up --service ml-service --detach

echo ""
echo "Check the logs to see training progress:"
echo "  railway logs --service ml-service"
