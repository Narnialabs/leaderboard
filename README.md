# Narnia Labs AI Benchmark Leaderboard

**A non-commercial research benchmark for evaluating and ranking AI models in manufacturing and engineering domains.**

Developed by [Narnia Labs](https://www.narnia.ai/), this leaderboard provides transparent, standardized performance benchmarks to objectively assess AI models across 2D image generation and 3D geometry tasks.

> **Live Dashboard:** [https://narnialabs.github.io/leaderboard/](https://narnialabs.github.io/leaderboard/)

---

## About

The Narnia Labs AI Benchmark Leaderboard is an open, non-commercial research platform designed to objectively evaluate generative and predictive AI models. Models are assessed on standardized datasets derived from real-world manufacturing and engineering applications, and ranked using a composite scoring methodology that balances output quality, distributional fidelity, and resource efficiency.

This benchmark is intended solely for academic and research evaluation purposes.

## Benchmark Domains

| Domain | Task | Description |
|--------|------|-------------|
| **2D Image Generation** | Generation | Evaluates generative models on engineering image synthesis tasks |
| **3D Geometry Generation** | Generation | Evaluates models that generate 3D point cloud geometries for engineering components |
| **3D Geometry Evaluation** | Evaluation | Evaluates predictive models that estimate engineering performance on 3D geometries |

## Evaluated Models

| Domain | Models |
|--------|--------|
| **2D Generation** | GAN, VAE, DCGAN, LSGAN, WGAN-CP, WGAN-GP, R1GAN, DDPM, VQVAE |
| **3D Generation** | DeepSDF, GAN3D, PointFlow, VAE, VQVAE |
| **3D Evaluation** | Predictive models for engineering performance estimation |

All models are benchmarked across four dataset sizes — **S** (50), **M** (100), **L** (200), **XL** (500) — to assess data efficiency and scalability.

## Evaluation Metrics

| Domain | Metrics |
|--------|---------|
| **2D Generation** | IS, FID, MS-SSIM, LPIPS, PSNR, Precision, Recall, Density, Coverage |
| **3D Generation** | FPD (Fréchet Point-cloud Distance) |
| **3D Evaluation** | MSE, MAE, R² |

Models are ranked using **BenchRank**, a graph-based ranking system combining Spearman correlation with debiased PageRank scoring for robust multi-metric evaluation.

## Features

- **Leaderboard Rankings** — Ranked model tables with multi-metric evaluation and visual heatmaps across dataset sizes (S/M/L/XL)
- **Interactive 3D Viewer** — Explore generated and predicted 3D point cloud geometries directly in the browser
- **Synchronized Dual 3D Viewer** — Side-by-side 3D comparison with camera-synced rotation and navigation
- **Inference Explorer** — Compare model outputs side-by-side with detailed per-model analysis
- **Scalability Analysis** — Benchmarks across multiple training-set sizes to assess data efficiency
- **Responsive Design** — Mobile-friendly layout with adaptive navigation

## Pages

| Page | Description |
|------|-------------|
| **Overview** | Mission statement, KPI dashboard, benchmark pipeline visualization, and domain status |
| **Leaderboard** | Interactive model rankings with filtering by dimension, task, and dataset size |
| **Inference Explorer** | Side-by-side model comparison with synchronized 3D viewers and generated image galleries |

## Datasets & Attribution

This benchmark utilizes the following research datasets. All datasets are used strictly within the terms of their respective licenses for non-commercial research purposes.

| Dataset | Source | License |
|---------|--------|---------|
| **DrivAerNet** | [Mohamedelrefaie/DrivAerNet](https://github.com/Mohamedelrefaie/DrivAerNet) | [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) |
| **DrivAerNet++** | [Mohamedelrefaie/DrivAerNet](https://github.com/Mohamedelrefaie/DrivAerNet) | [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) |
| **DeepJEB** | [KAIST-LENSE/DeepJEB](https://github.com/KAIST-LENSE/DeepJEB) | KAIST (proprietary) |

> Mohamed Elrefaie, Angela Dai, Florian Padberg. *DrivAerNet++: A Large-Scale Multimodal Car Dataset with Computational Fluid Dynamics Simulations and Deep Learning Benchmarks.* NeurIPS 2024 Datasets and Benchmarks Track.

## Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript
- [Chart.js](https://www.chartjs.org/) — Data visualization
- [PapaParse](https://www.papaparse.com/) — CSV data loading
- [Three.js](https://threejs.org/) — 3D point cloud rendering

## Local Development

No build tools required. Serve the project directory with any static HTTP server:

```bash
# Python
python -m http.server 8000

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8000` in your browser.

## About Narnia Labs

Narnia Labs is an AI technology company revolutionizing the product development process. Our no-code AI platform, **AslanX**, empowers manufacturers with generative and predictive AI capabilities — from design generation to performance evaluation and optimization.

Learn more at [narnia.ai](https://www.narnia.ai/).

## License

This project's **source code** is proprietary and owned by Narnia Labs.

The **datasets** used in this benchmark retain their original licenses as specified by their respective authors. Please refer to the [Datasets & Attribution](#datasets--attribution) section for details.

This benchmark is provided for non-commercial research and academic evaluation only.

Copyright (c) Narnia Labs. All rights reserved.
