import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

// console.log(process.env.REPLICATE_API_TOKEN);
const input = {
  steps: 25,
  prompt: "The world's largest black forest cake, the size of a building, surrounded by trees of the black forest",
  guidance: 3,
  interval: 2,
  aspect_ratio: "1:1",
  output_format: "webp",
  output_quality: 80,
  safety_tolerance: 2
};

async function fluxPro() {
  const output = await replicate.run("black-forest-labs/flux-pro", { input });
  console.log(output);
}

// fluxPro();
