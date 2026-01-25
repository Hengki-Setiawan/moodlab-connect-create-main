import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface ProductSkeletonProps {
    count?: number;
}

const ProductSkeleton = ({ count = 6 }: ProductSkeletonProps) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <Card key={index} className="overflow-hidden animate-pulse">
                    <CardHeader className="p-0">
                        {/* Image skeleton */}
                        <Skeleton className="aspect-video w-full" />
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {/* Badge skeleton */}
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        {/* Title skeleton */}
                        <Skeleton className="h-6 w-3/4" />
                        {/* Description skeleton */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                        {/* Price skeleton */}
                        <Skeleton className="h-7 w-1/3" />
                    </CardContent>
                    <CardFooter className="p-4 pt-0 gap-2">
                        {/* Button skeletons */}
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-10" />
                    </CardFooter>
                </Card>
            ))}
        </>
    );
};

export default ProductSkeleton;
