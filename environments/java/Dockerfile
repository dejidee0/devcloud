FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y curl git ca-certificates openjdk-21-jdk maven && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://code-server.dev/install.sh | sh
RUN useradd -m -s /bin/bash developer && mkdir -p /workspace && chown -R developer:developer /workspace
COPY start.sh /usr/local/bin/devcloud-start
RUN chmod +x /usr/local/bin/devcloud-start
USER developer
WORKDIR /workspace
EXPOSE 8443
CMD ["devcloud-start"]
