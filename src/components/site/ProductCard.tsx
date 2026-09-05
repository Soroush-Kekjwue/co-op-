import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatTomanShort, toPersianDigits } from "@/lib/format";
import { ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router";

export interface ProductCardData {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  unit: string;
  stock: number;
  shortDescription?: string;
  origin: string;
  isSeasonal: boolean;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { add } = useCart();
  const navigate = useNavigate();
  const inStock = product.stock > 0;

  return (
    <div className="paper-grain group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/product/${product.slug}`} className="relative block">
        <div className="img-vintage flex h-44 items-center justify-center border-b border-border/70 bg-secondary/50">
          <span className="font-display text-5xl text-accent/60">
            {product.name.slice(0, 1)}
          </span>
        </div>
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          {product.isSeasonal && (
            <Badge className="vintage-stamp bg-card/90 text-xs">فصلی</Badge>
          )}
          {!inStock && (
            <Badge className="bg-destructive/90 text-xs text-destructive-foreground">
              ناموجود
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] text-muted-foreground">مبدأ: {product.origin}</p>
        <Link
          to={`/product/${product.slug}`}
          className="font-display text-lg font-bold leading-7 hover:text-primary"
        >
          {product.name}
        </Link>
        {product.shortDescription && (
          <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">
            {product.shortDescription}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <div className="font-bold text-primary">
              {formatTomanShort(product.price)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              هر {product.unit}
            </div>
            {product.comparePrice && product.comparePrice > product.price && (
              <div className="text-[11px] text-muted-foreground line-through">
                {formatTomanShort(product.comparePrice)}
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!inStock}
            onClick={() => {
              add(product._id as never, 1);
              navigate("/cart");
            }}
          >
            <ShoppingCart className="size-3.5" />
            افزودن
          </Button>
        </div>
      </div>
    </div>
  );
}
