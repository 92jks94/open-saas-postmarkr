import { TEXT_STYLES, SPACING } from './constants';

interface SectionHeaderProps {
  id: string;
  title: string;
  highlightedText?: string;
  subtitle: string;
  highlightType?: 'primary' | 'accent';
}

export default function SectionHeader({
  id,
  title,
  highlightedText,
  subtitle,
  highlightType = 'primary'
}: SectionHeaderProps) {
  const gradientClass = highlightType === 'primary' 
    ? 'bg-gradient-primary bg-clip-text text-transparent'
    : 'bg-gradient-accent bg-clip-text text-transparent';

  return (
    <div className={`text-center ${SPACING.SECTION_TITLE_MARGIN} animate-fade-in-up`}>
      <h2 id={id} className={`${TEXT_STYLES.SECTION_HEADING} ${SPACING.HEADING_MARGIN}`}>
        {title}
        {highlightedText && (
          <>
            {' '}
            <span className={gradientClass}>{highlightedText}</span>
          </>
        )}
      </h2>
      <p className={`${TEXT_STYLES.SECTION_SUBHEADING} max-w-2xl mx-auto`}>
        {subtitle}
      </p>
    </div>
  );
}
