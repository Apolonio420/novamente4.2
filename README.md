# NovaMente AI-Powered Apparel

NovaMente is a modern e-commerce platform that combines AI-generated designs with high-quality apparel. Users can create unique, personalized clothing using our AI design tools.

## Features

- AI-powered image generation for custom apparel designs
- Interactive design editor for placing images on garments
- Shopping cart and checkout functionality
- Responsive design for all devices

## Prompt Optimizer v8

### What it does

The Prompt Optimizer automatically enhances user prompts to ensure they generate clean, isolated artwork suitable for printing on apparel. It:

- Ensures designs have a centered composition on a plain white background
- Creates high-contrast images with crisp edges suitable for printing
- Preserves the user's intended subject
- Supports different compositions: centered, vertically centered, or horizontally centered
- Completely eliminates design software UI elements from generated images

### Key Improvements in v8

After extensive research on DALL-E 3's behavior, we've completely redesigned our prompt optimization strategy to focus on positive descriptions rather than negative instructions:

1. **Focus on Positive Language**
   - Completely eliminated negative instructions like "DO NOT SHOW" or "NO UI"
   - Replaced with positive descriptions like "isolated subject" and "on a plain white background"
   - Uses natural language patterns that describe what we want, not what we don't want

2. **Removal of ALL Trigger Words**
   - Automatically removes ALL known trigger words from user prompts
   - Eliminates terms like "design", "vector", "digital", "illustration", "mockup", etc.
   - Prevents any association with design software or interfaces

3. **Simple, Clear Structure**
   - Starts with "Illustration:" to set the proper context
   - Uses periods instead of commas to separate concepts more clearly
   - Keeps the prompt concise and focused on the essential elements

4. **Composition-Based Approach**
   - Uses "centered composition", "vertically centered composition", or "horizontally centered composition"
   - Avoids technical terms like "aspect ratio", "layout", or "orientation"
   - Describes the composition in natural language that DALL-E understands

### Example before/after prompts

**Original user prompt:**
\`\`\`
vector design of a cute fox
\`\`\`

**After optimization (v7):**
\`\`\`
PURE ARTWORK ONLY: cute fox, clean art with bold outlines, 1:1 aspect ratio, print-ready, high-resolution, centered composition, pure white background, high-contrast colors, crisp edges, DO NOT SHOW ANY SOFTWARE INTERFACE. NO DESIGN SOFTWARE. NO RULERS. NO TOOLBARS. NO UI ELEMENTS. NO FRAMES. NO MOCK-UPS. ARTWORK ONLY ON WHITE BACKGROUND.
\`\`\`

**After optimization (v8):**
\`\`\`
Illustration: of a cute fox. bold-lined, flat-color art style. centered composition. on a plain white background. isolated subject with no other elements. high-contrast colors with crisp edges
\`\`\`

### How to run unit tests

\`\`\`bash
# Using npm
npm run test

# Using pnpm
pnpm test

# Using yarn
yarn test
\`\`\`

## Development

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`
OPENAI_API_KEY=your_openai_api_key
REMOVE_BG_KEY=your_remove_bg_api_key
MP_ACCESS_TOKEN=your_mercado_pago_access_token
NEXT_PUBLIC_BASE_URL=http://localhost:3000
\`\`\`

### Running the project

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

## Technologies

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI API (DALL-E)
- Mercado Pago SDK
