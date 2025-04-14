# Cricket Scoring Application

This project is a **Cricket Scoring Application** built using [Next.js](https://nextjs.org). It provides real-time scoring, match management, and player statistics for cricket matches.

## Features

- **Live Scoring**: Track ball-by-ball updates, runs, wickets, and extras.
- **Player Statistics**: View batting, bowling, and fielding stats for players.
- **Match Management**: Schedule matches, manage teams, and update match statuses.
- **Interactive UI**: User-friendly interface for administrators and viewers.
- **Real-Time Updates**: Seamless updates for live matches.

## Getting Started

First, install the dependencies:

```bash
npm install --force
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application in action.

## Environment Variables

This project includes a `.env` file with personal credentials. **Do not share this file** to avoid exposing sensitive information. It is recommended to create your own `.env` file and set up a personal [MongoDB cluster](https://www.mongodb.com/cloud/atlas) for database connectivity.

## Cricket Rules Overview

Cricket is a bat-and-ball game played between two teams of 11 players. Key aspects include:

- **Innings**: Each team bats and bowls in turns. The goal is to score as many runs as possible while limiting the opponent's runs.
- **Overs**: Each over consists of 6 legal deliveries bowled by a bowler.
- **Runs**: Scored by hitting the ball and running between the wickets or through extras like wides and no-balls.
- **Wickets**: A batsman is dismissed through methods like bowled, caught, or run out.

## Learn More

To learn more about cricket and its rules, check out:

- [ICC Cricket Rules](https://www.icc-cricket.com/about/cricket/rules-and-regulations)
- [Cricket Basics](https://www.britannica.com/sports/cricket-sport)

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
