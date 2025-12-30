# Design System - BeerMenu App

## 🎨 Color Palette

### Primary Colors
- **Amber**: `from-amber-500 to-orange-500` - Primary brand gradient
- **Amber Light**: `from-amber-50 to-orange-50` - Light backgrounds
- **Amber Dark**: `from-amber-950/40 to-orange-950/40` - Dark mode backgrounds

### Background Gradients
- **Light Mode**: `bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50`
- **Dark Mode**: `dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`

### Accent Colors
- **Blue**: `from-blue-500 to-cyan-500` - Info/Stats
- **Green**: `from-green-500 to-emerald-500` - Success/Positive
- **Red**: `from-red-500 to-rose-500` - Error/Negative
- **Purple**: `from-purple-500 to-pink-500` - Special/Featured
- **Yellow**: `from-yellow-400 to-amber-500` - Highlight/Trophy

### Text Colors
- **Primary**: `text-gray-900 dark:text-white`
- **Secondary**: `text-gray-600 dark:text-gray-300`
- **Tertiary**: `text-gray-500 dark:text-gray-400`
- **Amber Text**: `text-amber-600 dark:text-amber-500`

### Border Colors
- **Default**: `border-amber-100 dark:border-gray-700`
- **Amber**: `border-amber-200 dark:border-amber-900/30`

## 📐 Spacing

### Container
- **Max Width**: `max-w-7xl`
- **Padding**: `px-4 py-8`

### Margins
- **Section**: `mb-8` (32px)
- **Card**: `mb-6` (24px)
- **Element**: `mb-4` (16px)
- **Small**: `mb-2` (8px)

### Padding
- **Card Large**: `p-8` (32px)
- **Card Medium**: `p-6` (24px)
- **Card Small**: `p-4` (16px)
- **Button**: `px-6 py-3` (24px/12px)

### Gaps
- **Grid**: `gap-6` (24px)
- **Flex**: `gap-4` (16px)
- **Small**: `gap-2` (8px)

## 🔤 Typography

### Font Families
- **Heading**: `font-heading` (Distortion)
- **Body**: `font-sans` (Neue Montreal)

### Font Sizes
- **Hero**: `text-6xl md:text-7xl` (60px/72px)
- **H1**: `text-5xl md:text-6xl` (48px/60px)
- **H2**: `text-2xl` (24px)
- **H3**: `text-xl` (20px)
- **Body**: `text-base` (16px)
- **Small**: `text-sm` (14px)
- **Tiny**: `text-xs` (12px)

### Font Weights
- **Bold**: `font-bold` (700)
- **Semibold**: `font-semibold` (600)
- **Medium**: `font-medium` (500)
- **Normal**: `font-normal` (400)

## 🎭 Components

### Card Component
```tsx
<Card className="p-6">
  {children}
</Card>
```
- Background: `bg-white/80 dark:bg-gray-800/80`
- Border: `border border-amber-100 dark:border-gray-700`
- Radius: `rounded-2xl`
- Shadow: `shadow-lg`
- Backdrop: `backdrop-blur-sm`

### Button Styles
- **Primary**: `bg-gradient-to-r from-amber-500 to-orange-500 text-white`
- **Secondary**: `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300`
- **Padding**: `px-6 py-3`
- **Radius**: `rounded-xl`
- **Hover**: `hover:shadow-lg`
- **Active**: `active:scale-95`
- **Min Height**: `min-h-[48px]` (touch-friendly)

### Input Styles
- **Border**: `border border-gray-300 dark:border-gray-600`
- **Focus**: `focus:ring-2 focus:ring-amber-500 focus:border-transparent`
- **Background**: `bg-white/80 dark:bg-gray-700/80`
- **Padding**: `px-4 py-3`
- **Radius**: `rounded-xl`
- **Min Height**: `min-h-[48px]`

### Icon Containers
- **Small**: `p-2` with `w-5 h-5` icon
- **Medium**: `p-3` with `w-6 h-6` icon
- **Large**: `p-4` with `w-8 h-8` icon
- **Background**: Gradient matching context
- **Radius**: `rounded-xl` or `rounded-lg`

## ✨ Animations

### Configuration
```typescript
duration: {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
}
ease: {
  smooth: 'power2.out',
  snappy: 'power2.inOut',
  bounce: 'back.out(1.4)',
}
```

### Animation Principles
- **No Layout Shift**: Start with opacity 0.8-1, no position changes
- **Subtle**: Fade animations only on page load
- **Hover**: 4px lift, 1.01 scale
- **Active**: 0.95 scale
- **Stagger**: 0.03s for grids

## 🎯 Layout Patterns

### Page Structure
```tsx
<PageLayout title="Title" subtitle="Subtitle">
  <Card className="p-6 mb-8">
    {/* Content */}
  </Card>
</PageLayout>
```

### Grid Layouts
- **2 Columns**: `grid-cols-1 md:grid-cols-2`
- **3 Columns**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **4 Columns**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **5 Columns**: `grid-cols-2 md:grid-cols-5`

### Responsive Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

## 🌓 Dark Mode

### Background Layers
- **Base**: `dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`
- **Card**: `dark:bg-gray-800/80`
- **Elevated**: `dark:bg-gray-700`

### Text in Dark Mode
- **Primary**: `dark:text-white`
- **Secondary**: `dark:text-gray-300`
- **Tertiary**: `dark:text-gray-400`
- **Amber**: `dark:text-amber-500`

### Borders in Dark Mode
- **Default**: `dark:border-gray-700`
- **Subtle**: `dark:border-gray-800`
- **Accent**: `dark:border-amber-900/30`

## 📱 Mobile Optimization

### Touch Targets
- **Minimum**: `min-h-[44px]` (iOS guideline)
- **Recommended**: `min-h-[48px]`
- **Padding**: At least `px-4 py-3`

### Mobile-First Classes
- **Hide on Mobile**: `hidden md:block`
- **Show on Mobile**: `block md:hidden`
- **Stack on Mobile**: `flex-col md:flex-row`

## 🎨 Special Elements

### Gradient Stats Cards
```tsx
<Card className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white border-none">
  <div className="flex items-center justify-between mb-2">
    <Icon className="w-8 h-8 opacity-80" />
    <span className="text-3xl font-bold">{value}</span>
  </div>
  <p className="text-sm font-semibold opacity-90">{label}</p>
</Card>
```

### Beer Card Links
```tsx
<a className="group bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-4 hover:shadow-lg transition-all active:scale-95 border border-amber-200 dark:border-amber-900/30">
  {/* Content */}
</a>
```

### Loading States
```tsx
<div className="flex justify-center items-center py-20">
  <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
</div>
```

## ✅ Consistency Checklist

- [ ] All pages use PageLayout or consistent background gradient
- [ ] All cards use Card component with consistent styling
- [ ] All buttons have min-h-[48px] and consistent padding
- [ ] All inputs have consistent border, focus, and padding
- [ ] All icons use consistent sizing (w-5 h-5, w-6 h-6, w-8 h-8)
- [ ] All gradients use consistent color combinations
- [ ] All text uses consistent color classes
- [ ] All spacing uses consistent margin/padding values
- [ ] All animations are subtle and don't cause layout shift
- [ ] All components work in both light and dark mode
