# Banner Images TODO

## Overview
Blog posts now support featured images via frontmatter. The system automatically falls back to `default-banner.webp` if a specific image doesn't exist.

## Status
✅ Frontmatter updated for key blog posts with image metadata
⏳ Need to create actual banner images for these posts

## Posts Updated with Image Metadata (Need Images Created)

The following posts have been updated with image frontmatter and need corresponding banner images created:

### Recently Updated Posts
1. `2025-11-19-secure-mail-without-po-box.webp`
   - Alt: "Secure virtual mailbox with encrypted mail management and digital scanning"
   - Theme: Security, virtual mailbox, encryption

2. `2025-10-14-digital-mail-vs-virtual-mailbox.webp`
   - Alt: "Comparison of digital mail and virtual mailbox services for remote businesses"
   - Theme: Comparison chart, dual concept

3. `2025-10-13-when-does-the-mail-actually-show-up.webp`
   - Alt: "USPS mail carrier delivering packages - delivery schedule and hours guide"
   - Theme: Mail delivery, clock/schedule, USPS truck

4. `2025-09-26-usps-partner-locations-explained.webp`
   - Alt: "USPS Contract Postal Units, Approved Shippers, and Self-Service Kiosks comparison"
   - Theme: Multiple location types, comparison

5. `2025-09-19-find-post-office-by-zip-code.webp`
   - Alt: "USPS location finder showing post offices, collection boxes, and service kiosks by ZIP code"
   - Theme: Map, location pins, search

6. `2025-08-09-digital-mailroom.webp`
   - Alt: "Digital mailroom showing virtual mailbox management and automated mail workflows"
   - Theme: Digital workspace, mail scanning, workflow

7. `2025-06-07-certified-mail-made-easy.webp`
   - Alt: "Automated certified mail service with electronic proof of delivery and online tracking"
   - Theme: Certified mail, green card, tracking, automation

## Existing Banner Images
✅ `default-banner.webp` - Currently serves as fallback
✅ `2024-01-29-address-management-best-practices.webp`
✅ `2024-02-05-delivery-tracking-guide.webp`
✅ `2023-11-21-coverlettergpt.webp`

## Recommended Banner Image Specifications

### Technical Requirements
- **Format:** WebP (for best compression and modern browser support)
- **Dimensions:** 1200x630px (optimal for Open Graph/social sharing)
- **File Size:** Under 200KB for fast loading
- **Color Space:** sRGB

### Design Guidelines
1. **Visual Hierarchy:** Main focal point should be in center
2. **Text Overlay:** Ensure images work with gradient title overlay
3. **Brand Consistency:** Use Postmarkr brand colors where appropriate
4. **Readability:** Avoid overly busy backgrounds
5. **Mobile Consideration:** Key elements should be visible when cropped

### Creating Banner Images

#### Option 1: Design Tools
Use Canva, Figma, or Adobe Express with these templates:
- Blog Header (1200x630px)
- Social Media Post (1200x630px)
- Featured Image template

#### Option 2: AI Image Generation
Use Midjourney, DALL-E, or Stable Diffusion with prompts like:
```
Professional business illustration showing [topic], modern flat design, 
clean layout, corporate blue and purple gradient, minimalist style, 
suitable for blog header, 16:9 aspect ratio
```

#### Option 3: Stock Photo + Overlay
1. Get high-quality stock photos from Unsplash/Pexels
2. Add subtle gradient overlay (brand colors)
3. Resize to 1200x630px
4. Export as WebP

### Quick Win Approach
For immediate deployment:
1. Create 3-5 "template" banners with different themes:
   - Mail/envelope theme (for general mail posts)
   - Security theme (for security/compliance posts)
   - Technology theme (for digital mail posts)
   - Location theme (for USPS/post office posts)
   - Automation theme (for workflow posts)

2. Use color overlays on the default-banner.webp to create variations
3. Add subtle icons or illustrations related to each category

## Bulk Creation Script (Optional)

```bash
# Create placeholder images that use default but with category overlay
# This would require imagemagick or similar
for post in 2025-*.webp; do
  if [ ! -f "blog/public/banner-images/$post" ]; then
    echo "Need to create: $post"
    # Could copy default-banner.webp as placeholder
    # cp blog/public/banner-images/default-banner.webp blog/public/banner-images/$post
  fi
done
```

## Next Steps

1. **Immediate:** All posts will use `default-banner.webp` as fallback (already working)
2. **Phase 1:** Create 7 priority images listed above (most recent/popular posts)
3. **Phase 2:** Create template images for common categories
4. **Phase 3:** Create unique images for remaining blog posts

## Notes
- The blog system is already fully functional without custom images (uses fallback)
- Images enhance SEO, social sharing, and visual appeal but are not blocking
- Can be created progressively as time/resources allow
- Consider hiring a designer or using AI tools for batch creation



