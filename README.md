# 🚀 Papi Peblob API

Une API moderne développée avec NestJS pour la gestion des Peblobs. Cette API suit les principes des microservices et offre une architecture scalable pour la communication entre services.

## ✨ Fonctionnalités

- 🏗️ Architecture microservices avec NestJS 11
- 📚 Documentation automatique avec Swagger
- ✅ Validation des données avec class-validator
- 🧪 Tests unitaires et d'intégration
- 🐳 Prêt pour Docker
- 🔄 CI/CD avec GitHub Actions
- 🌐 CORS configuré pour les appels inter-services

## 🛠️ Technologies

- **Framework**: NestJS 11.0.1
- **Runtime**: Node.js 20+
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Tests**: Jest
- **Conteneurisation**: Docker

## 🚦 Démarrage rapide

### Prérequis
- Node.js 18+ ou 20+
- npm ou yarn

### Installation

```bash
# Cloner le projet
git clone <your-repo-url>
cd papi-peblob

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Démarrer en mode développement
npm run start:dev
```

L'API sera disponible sur `http://localhost:3000`

## 📖 Documentation

Une fois l'application démarrée, la documentation Swagger est accessible sur :
- **Documentation**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests avec couverture
npm run test:cov

# Tests e2e
npm run test:e2e

# Tests en mode watch
npm run test:watch
```

## 🐳 Docker

```bash
# Build de l'image
docker build -t papi-peblob .

# Lancement du conteneur
docker run -p 3000:3000 papi-peblob
```

## 📋 API Endpoints

### Peblobs
- `GET /peblobs` - Liste tous les peblobs
- `GET /peblobs/:id` - Récupère un peblob par ID
- `POST /peblobs` - Crée un nouveau peblob
- `PATCH /peblobs/:id` - Met à jour un peblob
- `DELETE /peblobs/:id` - Supprime un peblob
- `GET /peblobs/stats` - Statistiques des peblobs

### Système
- `GET /` - Message de bienvenue
- `GET /health` - Vérification de santé

## 🏗️ Architecture

```
src/
├── app.module.ts          # Module principal
├── main.ts               # Point d'entrée
├── peblob/              # Module Peblob
│   ├── dto/             # Data Transfer Objects
│   ├── entities/        # Entités
│   ├── peblob.controller.ts
│   ├── peblob.service.ts
│   └── peblob.module.ts
└── test/                # Tests e2e
```

## 🚀 Déploiement

Le projet inclut une configuration GitHub Actions pour le CI/CD automatique. Push sur la branche `main` déclenche :

1. ✅ Tests automatiques
2. 🔍 Linting
3. 🏗️ Build de l'application
4. 🐳 Construction de l'image Docker

## 🤝 Contribution

1. Fork le projet
2. Crée une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit tes changements (`git commit -m 'Add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvre une Pull Request

## 📄 Licence

Ce projet est sous licence UNLICENSED - voir le fichier package.json pour plus de détails.

## 🔗 Liens utiles

- [Documentation NestJS](https://nestjs.com/)
- [Documentation Swagger](https://swagger.io/)
- [Docker](https://www.docker.com/)

---

💡 **Note**: Cette API est conçue pour fonctionner dans un écosystème de microservices. Elle peut communiquer avec d'autres APIs via HTTP ou message queues selon tes besoins.

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
