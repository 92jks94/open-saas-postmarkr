#!/usr/bin/env node

/**
 * Blog Post Template Generator
 * 
 * Quickly create a new blog post with proper frontmatter structure
 * 
 * Usage:
 *   node scripts/create-post-template.ts "My Blog Post Title"
 *   node scripts/create-post-template.ts "My Blog Post Title" --date 2025-10-16
 *   node scripts/create-post-template.ts "My Blog Post Title" --tags "tag1,tag2,tag3"
 */

import fs from 'fs';
import path from 'path';

interface PostOptions {
  title: string;
  date?: string;
  tags?: string[];
  description?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generatePostTemplate(options: PostOptions): string {
  const { title, date, tags = [], description } = options;
  
  const template = `---
title: "${title}"
date: ${date || new Date().toISOString().split('T')[0]}
description: "${description || 'ADD_DESCRIPTION_HERE (150-160 characters)'}"
authors: ["Postmarkr Team"]
tags: [${tags.map(t => `"${t}"`).join(', ')}]
image:
  url: "/banner-images/${date || 'YYYY-MM-DD'}-${slugify(title)}.webp"
  alt: "${title} - ${tags.slice(0, 2).join(', ')}"
---

## Introduction

[Write your introduction here]

---

## Main Content

[Add your content here]

---

## Conclusion

[Write your conclusion here]

---

*Word count: ~XXX*
`;

  return template;
}

function createPost(options: PostOptions, outputDir?: string): string {
  const date = options.date || new Date().toISOString().split('T')[0];
  const slug = slugify(options.title);
  const filename = `${date}-${slug}.md`;
  
  const dir = outputDir || path.join(process.cwd(), 'src/content/docs/blog');
  const filePath = path.join(dir, filename);
  
  if (fs.existsSync(filePath)) {
    throw new Error(`File already exists: ${filePath}`);
  }
  
  const content = generatePostTemplate(options);
  fs.writeFileSync(filePath, content, 'utf-8');
  
  return filePath;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
Blog Post Template Generator

Usage:
  node scripts/create-post-template.ts "Post Title" [options]

Options:
  --date YYYY-MM-DD       Set post date (default: today)
  --tags tag1,tag2,tag3   Comma-separated tags
  --description "text"    Meta description (150-160 chars)
  --output-dir path       Custom output directory

Examples:
  # Basic post
  node scripts/create-post-template.ts "How to Send Certified Mail"

  # With tags and custom date
  node scripts/create-post-template.ts "Virtual Mailbox Guide" \\
    --date 2025-10-16 \\
    --tags "virtual mailbox,remote business,mail automation"

  # With description
  node scripts/create-post-template.ts "USPS Delivery Schedule" \\
    --description "Learn USPS delivery times, days, and tracking options"
    `);
    return;
  }

  const title = args.find(arg => !arg.startsWith('--'));
  if (!title) {
    console.error('❌ Post title is required');
    process.exit(1);
  }

  const dateIndex = args.indexOf('--date');
  const tagsIndex = args.indexOf('--tags');
  const descIndex = args.indexOf('--description');
  const outputIndex = args.indexOf('--output-dir');

  const options: PostOptions = {
    title,
    date: dateIndex !== -1 ? args[dateIndex + 1] : undefined,
    tags: tagsIndex !== -1 ? args[tagsIndex + 1].split(',').map(t => t.trim()) : [],
    description: descIndex !== -1 ? args[descIndex + 1] : undefined,
  };

  const outputDir = outputIndex !== -1 ? args[outputIndex + 1] : undefined;

  try {
    const filePath = createPost(options, outputDir);
    console.log(`✅ Created blog post: ${path.basename(filePath)}`);
    console.log(`📁 Location: ${filePath}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Add your content to the file`);
    console.log(`   2. Update the description if using placeholder`);
    console.log(`   3. Run: node scripts/enhance-frontmatter.ts ${filePath}`);
    console.log(`   4. Create banner image or let it use fallback`);
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generatePostTemplate, createPost };


