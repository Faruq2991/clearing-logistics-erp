#!/bin/bash

cd ~/clearing-logistics-erp/frontend

echo "=========================================="
echo "Fixing Remaining TypeScript Errors"
echo "=========================================="

# Fix 1: CreateUserPage Grid components with component="div"
echo ""
echo "1. Fixing CreateUserPage.tsx Grid components..."
sed -i 's/<Grid item xs={\([0-9]*\)} component="div">/<Grid size={{ xs: \1 }}>/g' src/pages/CreateUserPage.tsx
echo "   ✓ Fixed CreateUserPage Grid components"

# Fix 2: Remove unused handleSubmit in CreateUserPage
echo ""
echo "2. Fixing unused handleSubmit in CreateUserPage..."
sed -i '/const { handleSubmit } = methods;/d' src/pages/CreateUserPage.tsx
echo "   ✓ Removed unused handleSubmit"

# Fix 3: Instructions for schema fix
echo ""
echo "3. Schema fix required in AddVehiclePage.tsx:"
echo "   You need to manually update the vehicleSchema to make status required"
echo ""
echo "   Find this line (around line 24):"
echo "   status: z.string().optional(),"
echo ""
echo "   Change it to:"
echo "   status: z.string().min(1, 'Status is required'),"
echo ""
echo "   OR add 'as any' type assertion to the resolver:"
echo "   resolver: zodResolver(vehicleSchema as any),"
echo ""

# Check for remaining Grid items
echo "=========================================="
echo "Verification"
echo "=========================================="
echo ""
GRID_ITEMS=$(grep -r "Grid item" src/pages/*.tsx 2>/dev/null | wc -l)
if [ "$GRID_ITEMS" -gt 0 ]; then
    echo "⚠ Grid items still remaining:"
    grep -n "Grid item" src/pages/*.tsx
else
    echo "✓ All Grid items fixed!"
fi

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Fix the schema in AddVehiclePage.tsx (see instructions above)"
echo "2. Run: npm run build"
echo ""