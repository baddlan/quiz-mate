# Multi-stage build for production QuizMate
FROM node:lts-alpine AS frontend-builder

# Build the frontend
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci --production=false
COPY frontend/ ./
RUN npm run build

# Production stage
FROM node:lts-alpine

# Create non-root user
RUN addgroup quiz-mate \
 && adduser --disabled-password --gecos "" --home "/home/quiz-mate" --ingroup "quiz-mate" quiz-mate \
 && mkdir -p /config \
 && chown -R quiz-mate:quiz-mate /config

USER quiz-mate
WORKDIR /home/quiz-mate

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci --production

# Copy backend source (exclude config files)
COPY --chown=quiz-mate:quiz-mate backend/ ./
RUN rm -f quiz-mate.cfg default.cfg src/default.cfg

# Copy built frontend from builder stage
COPY --from=frontend-builder --chown=quiz-mate:quiz-mate /build/frontend/build ./frontend

# Create startup script
RUN cat > run.sh <<'EOF'
#!/bin/sh

cd /config

# Create default config if it doesn't exist
if [ ! -f "/config/quiz-mate.cfg" ]; then
    cat > /config/quiz-mate.cfg <<CONFIGEOF
#-----------------------------------------------------------------------------------------------------------------------
# HTTP Server Configuration
#-----------------------------------------------------------------------------------------------------------------------

http-port = ${HTTP_PORT:-8080}

#-----------------------------------------------------------------------------------------------------------------------
# HTTPS Configuration (optional)
#-----------------------------------------------------------------------------------------------------------------------

https-port =
https-cert-file =
https-key-file =

#-----------------------------------------------------------------------------------------------------------------------
# Static Assets Source
# Options: local, github, or custom URL
#-----------------------------------------------------------------------------------------------------------------------

static-assets-source = ${STATIC_ASSETS_SOURCE:-local}
CONFIGEOF
fi

echo "------------------------------------------------------------------------------------------------------------------------"
echo "QuizMate Configuration"
echo "------------------------------------------------------------------------------------------------------------------------"
echo ""
grep -vE '^[ \t]*(#.*)?$' /config/quiz-mate.cfg | grep -vE '^[^=]*=[ \t]*$' || echo "Using default configuration"
echo ""
echo "------------------------------------------------------------------------------------------------------------------------"
echo "Starting QuizMate Server..."
echo "------------------------------------------------------------------------------------------------------------------------"
echo ""

cd /home/quiz-mate

# Create symlink to config file in /config
ln -sf /config/quiz-mate.cfg quiz-mate.cfg

node src/main.js
EOF

RUN chmod +x run.sh

# Default environment variables
ENV HTTP_PORT=8080
ENV HTTPS_PORT=
ENV STATIC_ASSETS_SOURCE=local
ENV NODE_ENV=production

# Expose HTTP port (HTTPS can be added via volume-mounted config)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${HTTP_PORT:-8080}', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["/bin/sh", "/home/quiz-mate/run.sh"]
