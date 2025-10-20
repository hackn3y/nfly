# NFL Predictor - Complete Setup Guide

This guide will walk you through setting up your NFL Predictor app from scratch to production-ready.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Configuration](#backend-configuration)
4. [Stripe Configuration](#stripe-configuration)
5. [Email Configuration](#email-configuration)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## Prerequisites

### Required Software

- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **MongoDB** 6+
- **Redis** 7+
- **Python** 3.10+ (for ML service)
- **Git**

### Accounts Needed

- **Stripe** account (for payments)
- **Email service** (Gmail, SendGrid, or Mailgun)
- **(Optional)** AWS/Digital Ocean for deployment

---

## Database Setup

### 1. Install PostgreSQL

**Windows:**
```bash
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey
choco install postgresql