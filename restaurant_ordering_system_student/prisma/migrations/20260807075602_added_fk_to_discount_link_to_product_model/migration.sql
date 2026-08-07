-- AddForeignKey
ALTER TABLE "discount" ADD CONSTRAINT "discount_target_product_id_fkey" FOREIGN KEY ("target_product_id") REFERENCES "product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;
