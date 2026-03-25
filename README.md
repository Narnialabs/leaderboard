# Narnia Labs AI Benchmark Leaderboard

**Official benchmark leaderboard for evaluating and ranking AI models in manufacturing and engineering domains.**

Developed by [Narnia Labs](https://www.narnia.ai/), this leaderboard provides transparent, standardized performance benchmarks to objectively assess AI models across 2D image generation and 3D geometry tasks.

> **Live Dashboard:** [https://narnialabs.github.io/leaderboard/](https://narnialabs.github.io/leaderboard/)

---

## About

The Narnia Labs AI Benchmark Leaderboard serves as an objective evaluation gateway for generative and predictive AI models. Models are assessed on standardized datasets derived from real-world manufacturing and engineering applications, and ranked using a composite scoring methodology that balances output quality, distributional fidelity, and resource efficiency.

## Benchmark Domains

| Domain | Task | Description |
|--------|------|-------------|
| **2D Image Generation** | Generation | Evaluates generative models on engineering image synthesis tasks |
| **3D Geometry Generation** | Generation | Evaluates models that generate 3D point cloud geometries for engineering components |
| **3D Geometry Evaluation** | Evaluation | Evaluates predictive models that estimate engineering performance on 3D geometries |

## Evaluation Metrics

| Domain | Metrics |
|--------|---------|
| **2D Generation** | IS, FID, LPIPS, PSNR, Precision, Recall, Coverage |
| **3D Generation** | FPD (Fréchet Point-cloud Distance) |
| **3D Evaluation** | MSE, MAE, R² |

Models are ranked using **BenchRank**, a graph-based ranking system combining Spearman correlation with debiased PageRank scoring for robust multi-metric evaluation.

## Features

- **Leaderboard Rankings** — Ranked model tables with multi-metric evaluation and visual heatmaps across dataset sizes (S/M/L/XL)
- **Interactive 3D Viewer** — Explore generated and predicted 3D point cloud geometries directly in the browser
- **Inference Explorer** — Compare model outputs side-by-side with detailed per-model analysis
- **Scalability Analysis** — Benchmarks across multiple training-set sizes to assess data efficiency

## Pages

| Page | Description |
|------|-------------|
| **Overview** | Mission statement, KPI dashboard, benchmark pipeline visualization, and domain status |
| **Leaderboard** | Interactive model rankings with filtering by dimension, task, and dataset size |
| **Inference Explorer** | Side-by-side model comparison with 3D viewers and generated image galleries |

## Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript
- [Chart.js](https://www.chartjs.org/) — Data visualization
- [PapaParse](https://www.papaparse.com/) — CSV data loading
- [Three.js](https://threejs.org/) — 3D point cloud rendering

## About Narnia Labs

Narnia Labs is an AI technology company revolutionizing the product development process. Our no-code AI platform, **AslanX**, empowers manufacturers with generative and predictive AI capabilities — from design generation to performance evaluation and optimization.

Learn more at [narnia.ai](https://www.narnia.ai/).

## License

Copyright (c) Narnia Labs. All rights reserved.
