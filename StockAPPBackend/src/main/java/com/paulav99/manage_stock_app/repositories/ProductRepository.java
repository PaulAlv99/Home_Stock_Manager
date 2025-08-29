package com.paulav99.manage_stock_app.repositories;
import com.paulav99.manage_stock_app.entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

}

