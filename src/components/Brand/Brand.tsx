import signatureDark from '../../assets/brand/signature-dark.svg';
import signatureLight from '../../assets/brand/signature-light.svg';
import wordmarkDark from '../../assets/brand/wordmark-dark.svg';
import wordmarkLight from '../../assets/brand/wordmark-light.svg';
import styles from './Brand.module.css';

// Brand / Marés. Signature when the "automóveis" descriptor stays legible, wordmark for
// compact contexts. Dark tone on light surfaces, light tone on navy/dark surfaces.
// Size it by height in the consumer's CSS; the width follows the asset's proportion.
const lockups = {
  signature: { dark: signatureDark, light: signatureLight, width: 1007.8497, height: 316.6083 },
  wordmark: { dark: wordmarkDark, light: wordmarkLight, width: 1008, height: 248 },
};

type BrandProps = {
  lockup: keyof typeof lockups;
  tone: 'dark' | 'light';
  alt?: string;
  className?: string;
};

export function Brand({ lockup, tone, alt = 'Marés Automóveis', className }: BrandProps) {
  const asset = lockups[lockup];
  return (
    <img
      src={asset[tone]}
      width={asset.width}
      height={asset.height}
      alt={alt}
      className={className ? `${styles.brand} ${className}` : styles.brand}
    />
  );
}
