FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y curl wget git ca-certificates gnupg apt-transport-https software-properties-common && rm -rf /var/lib/apt/lists/*
RUN wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O /tmp/packages-microsoft-prod.deb && dpkg -i /tmp/packages-microsoft-prod.deb
RUN apt-get update && ACCEPT_EULA=Y apt-get install -y dotnet-sdk-8.0 mssql-tools18 unixodbc-dev && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://code-server.dev/install.sh | sh
RUN useradd -m -s /bin/bash developer && mkdir -p /workspace && chown -R developer:developer /workspace
COPY start.sh /usr/local/bin/devcloud-start
RUN chmod +x /usr/local/bin/devcloud-start
USER developer
WORKDIR /workspace
EXPOSE 8443
CMD ["devcloud-start"]
