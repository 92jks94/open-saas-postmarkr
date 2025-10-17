#!/usr/bin/env node

/**
 * Automated Blog Post Frontmatter Enhancement Script
 * 
 * This script automatically enhances blog post frontmatter by:
 * 1. Auto-generating meta descriptions from content (first paragraph or summary)
 * 2. Adding missing required fields with sensible defaults
 * 3. Validating frontmatter completeness
 * 4. Optionally generating image metadata with fallback
 * 
 * Usage:
 *   node scripts/enhance-frontmatter.ts <file-path>
 *   node scripts/enhance-frontmatter.ts --all  # Process all blog posts
 *   node scripts/enhance-frontmatter.ts --check  # Validate only, no changes
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface BlogFrontmatter {
  title?: string;
  date?: string;
  description?: string;
  authors?: string[];
  tags?: string[];
  image?: {
    url?: string;
    alt?: string;
  };
}

/**
 * Extract a clean summary from markdown content
 * @param content Raw markdown content
 * @param maxLength Maximum character length
 * @returns Clean summary text
 */
function extractSummary(content: string, maxLength: number = 160): string {
  // Remove markdown formatting
  let clean = content
    .replace(/^#{1,6}\s+/gm, '') // Remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
    .replace(/`(.+?)`/g, '$1') // Remove inline code
    .replace(/^[-*+]\s+/gm, '') // Remove list markers
    .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
    .replace(/^>\s+/gm, '') // Remove blockquotes
    .replace(/\n{2,}/g, ' ') // Replace multiple newlines
    .trim();

  // Get first meaningful paragraph (skip very short intro lines)
  const paragraphs = clean.split('\n').filter(p => p.trim().length > 50);
  const firstParagraph = paragraphs[0] || clean;

  // Truncate to maxLength at sentence boundary
  if (firstParagraph.length <= maxLength) {
    return firstParagraph;
  }

  // Try to cut at sentence boundary
  const sentences = firstParagraph.match(/[^.!?]+[.!?]+/g) || [firstParagraph];
  let description = '';
  
  for (const sentence of sentences) {
    if ((description + sentence).length <= maxLength - 3) {
      description += sentence;
    } else {
      break;
    }
  }

  // If we got at least one sentence, use it
  if (description.length > 50) {
    return description.trim();
  }

  // Otherwise, hard truncate with ellipsis
  return firstParagraph.substring(0, maxLength - 3).trim() + '...';
}

/**
 * Generate image alt text from title and tags
 */
function generateImageAlt(title: string, tags: string[] = []): string {
  const tagContext = tags.slice(0, 3).join(', ');
  return `${title}${tagContext ? ` - ${tagContext}` : ''}`.substring(0, 120);
}

/**
 * Generate image filename from blog post filename
 */
function generateImageFilename(filename: string): string {
  // Extract date and slug from filename (e.g., 2025-10-16-my-post.md)
  const basename = path.basename(filename, '.md');
  return `/banner-images/${basename}.webp`;
}

/**
 * Validate and enhance blog post frontmatter
 */
function enhanceFrontmatter(
  filePath: string,
  options: {
    dryRun?: boolean;
    generateDescription?: boolean;
    generateImage?: boolean;
    overwriteDescription?: boolean;
  } = {}
): { changed: boolean; issues: string[] } {
  const {
    dryRun = false,
    generateDescription = true,
    generateImage = true,
    overwriteDescription = false,
  } = options;

  const issues: string[] = [];
  let changed = false;

  // Read file
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(fileContent) as { 
    data: BlogFrontmatter; 
    content: string;
  };

  // Track original state for comparison
  const originalFrontmatter = JSON.stringify(frontmatter);

  // 1. Validate title
  if (!frontmatter.title) {
    issues.push('Missing title');
    frontmatter.title = path.basename(filePath, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' ');
    changed = true;
  }

  // 2. Validate date
  if (!frontmatter.date) {
    issues.push('Missing date');
    // Extract from filename if present (YYYY-MM-DD format)
    const dateMatch = path.basename(filePath).match(/^(\d{4}-\d{2}-\d{2})-/);
    frontmatter.date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
    changed = true;
  }

  // 3. Generate or validate description
  if (!frontmatter.description || (overwriteDescription && generateDescription)) {
    if (!frontmatter.description) {
      issues.push('Missing description');
    }
    if (generateDescription) {
      frontmatter.description = extractSummary(content, 160);
      changed = true;
    }
  } else if (frontmatter.description.length > 165) {
    issues.push(`Description too long (${frontmatter.description.length} chars, should be 150-160)`);
  } else if (frontmatter.description.length < 100) {
    issues.push(`Description too short (${frontmatter.description.length} chars, should be 150-160)`);
  }

  // 4. Validate authors
  if (!frontmatter.authors || frontmatter.authors.length === 0) {
    issues.push('Missing authors');
    frontmatter.authors = ['Postmarkr Team'];
    changed = true;
  }

  // 5. Validate tags
  if (!frontmatter.tags || frontmatter.tags.length === 0) {
    issues.push('Missing tags - add relevant tags for SEO');
  }

  // 6. Generate image metadata if missing
  if (generateImage && !frontmatter.image) {
    frontmatter.image = {
      url: generateImageFilename(filePath),
      alt: generateImageAlt(frontmatter.title || '', frontmatter.tags),
    };
    changed = true;
  }

  // Write back if changed
  if (changed && !dryRun) {
    const newContent = matter.stringify(content, frontmatter);
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }

  return { changed, issues };
}

/**
 * Process all blog posts in directory
 */
function processAllPosts(
  directory: string,
  options: Parameters<typeof enhanceFrontmatter>[1]
) {
  const files = fs.readdirSync(directory).filter(f => f.endsWith('.md'));
  
  console.log(`\n📚 Processing ${files.length} blog posts...\n`);
  
  const results = {
    processed: 0,
    changed: 0,
    withIssues: 0,
    issues: [] as Array<{ file: string; issues: string[] }>,
  };

  for (const file of files) {
    const filePath = path.join(directory, file);
    const result = enhanceFrontmatter(filePath, options);
    
    results.processed++;
    if (result.changed) results.changed++;
    if (result.issues.length > 0) {
      results.withIssues++;
      results.issues.push({ file, issues: result.issues });
    }

    // Show progress
    const status = result.changed ? '✅ Updated' : '✓ OK';
    console.log(`${status} ${file}`);
    if (result.issues.length > 0) {
      result.issues.forEach(issue => console.log(`  ⚠️  ${issue}`));
    }
  }

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`  Total processed: ${results.processed}`);
  console.log(`  Files updated: ${results.changed}`);
  console.log(`  Files with issues: ${results.withIssues}`);
  
  if (options.dryRun) {
    console.log(`\n🔍 Dry run mode - no files were modified`);
  }

  return results;
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);
  
  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Blog Post Frontmatter Enhancement Script

Usage:
  node scripts/enhance-frontmatter.ts <file-path>                Process single file
  node scripts/enhance-frontmatter.ts --all                      Process all blog posts
  node scripts/enhance-frontmatter.ts --check                    Check only, no changes
  node scripts/enhance-frontmatter.ts --all --no-description     Skip description generation
  node scripts/enhance-frontmatter.ts --all --overwrite          Overwrite existing descriptions

Options:
  --all                   Process all blog posts in content/docs/blog
  --check                 Dry run - show what would change without modifying files
  --no-description        Skip automatic description generation
  --no-image              Skip automatic image metadata generation
  --overwrite             Overwrite existing descriptions with auto-generated ones
  --help, -h              Show this help message

Examples:
  # Check all posts for issues
  node scripts/enhance-frontmatter.ts --all --check

  # Update all posts with missing frontmatter
  node scripts/enhance-frontmatter.ts --all

  # Update single post
  node scripts/enhance-frontmatter.ts src/content/docs/blog/my-post.md
    `);
    return;
  }

  const options = {
    dryRun: args.includes('--check'),
    generateDescription: !args.includes('--no-description'),
    generateImage: !args.includes('--no-image'),
    overwriteDescription: args.includes('--overwrite'),
  };

  // Process all posts
  if (args.includes('--all')) {
    const blogDir = path.join(process.cwd(), 'src/content/docs/blog');
    if (!fs.existsSync(blogDir)) {
      console.error(`❌ Blog directory not found: ${blogDir}`);
      process.exit(1);
    }
    processAllPosts(blogDir, options);
    return;
  }

  // Process single file
  const filePath = args.find(arg => !arg.startsWith('--'));
  if (!filePath) {
    console.error('❌ No file path provided. Use --help for usage information.');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`\n📝 Processing ${path.basename(filePath)}...\n`);
  const result = enhanceFrontmatter(filePath, options);
  
  if (result.issues.length > 0) {
    console.log('Issues found:');
    result.issues.forEach(issue => console.log(`  ⚠️  ${issue}`));
  }
  
  if (result.changed) {
    console.log(options.dryRun ? '\n✓ Would update file' : '\n✅ File updated');
  } else {
    console.log('\n✓ No changes needed');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { enhanceFrontmatter, extractSummary, generateImageAlt };


