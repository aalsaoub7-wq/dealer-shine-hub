
## Fix: Tab buttons not glowing red when active

The problem is that `TooltipTrigger asChild` directly on `TabsTrigger` causes Radix Tooltip's `data-state` attribute to override Radix Tabs' `data-state`, breaking `data-[state=active]` styling.

### Fix — single file: `src/pages/CarDetail.tsx`

Wrap each `TabsTrigger` in a `<span>` inside `<TooltipTrigger asChild>`, so Tooltip's `data-state` goes on the `<span>` wrapper instead of directly on the `TabsTrigger` button:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span>
      <TabsTrigger value="main" className="...">
        ...
      </TabsTrigger>
    </span>
  </TooltipTrigger>
  <TooltipContent>...</TooltipContent>
</Tooltip>
```

Same pattern for all three tabs. No other changes.
