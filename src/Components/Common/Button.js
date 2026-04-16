import React from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

export default function Button({
  type = 'primary',    // 'primary' | 'secondary' | 'ghost'
  size = 'xl',         // 'xl' | 'lg' | 'md' | 'sm'
  htmlType = 'button',
  children,
  onClick,
  disabled = false,
  className = '',
  style,
  ariaBusy,
  ariaLabel,
  block = false,
  loading = false,
  shine = false,       // kept for backwards-compat (adds the old shine pulse)
  sheen = true,        // NEW: hover light sweep (default on)
  iconLeft,
  as = 'button',
  href,
  shape = 'rounded',   // NEW: 'rounded' | 'pill' | 'soft'
}) {
  const Comp = as === 'a' ? 'a' : 'button';
  const isDisabled = disabled || loading;

  return (
    <Comp
      type={as === 'a' ? undefined : htmlType}
      href={as === 'a' ? href : undefined}
      className={clsx(
        styles.btn,
        styles[size],
        styles[type] || styles.primary,
        styles[shape] || styles.rounded,
        block && styles.block,
        loading && styles.loading,
        shine && styles.shine,   // legacy shimmer
        sheen && styles.sheen,   // hover sweep
        className
      )}
      onClick={onClick}
      disabled={as !== 'a' ? isDisabled : undefined}
      aria-busy={ariaBusy || loading || undefined}
      aria-disabled={isDisabled || undefined}
      aria-label={ariaLabel || undefined}
      style={style}
    >
      {iconLeft && <span className={styles.icon}>{iconLeft}</span>}
      <span className={styles.label}>{children}</span>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
    </Comp>
  );
}
