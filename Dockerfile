FROM node:22-alpine

WORKDIR /app

# Asumimos que dentro de gestion-quinchau/ habrá una carpeta 'dist'
# que subiste en el .zip
COPY dist/quinchau_virtual ./dist/quinchau_virtual

EXPOSE 4004

CMD ["node", "dist/quinchau_virtual/server/server.mjs"]