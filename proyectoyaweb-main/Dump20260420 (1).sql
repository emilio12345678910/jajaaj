-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: ya
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `chat_historial`
--

DROP TABLE IF EXISTS `chat_historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_historial` (
  `id_mensaje` int NOT NULL AUTO_INCREMENT,
  `id_restaurante` int NOT NULL,
  `id_usuario` int NOT NULL,
  `rol_mensaje` enum('user','model') NOT NULL,
  `contenido` text NOT NULL,
  `fecha_mensaje` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_mensaje`),
  KEY `fk_chat_restaurante` (`id_restaurante`),
  KEY `fk_chat_usuario` (`id_usuario`),
  CONSTRAINT `fk_chat_restaurante` FOREIGN KEY (`id_restaurante`) REFERENCES `restaurante` (`id_restaurante`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `m_usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_historial`
--

LOCK TABLES `chat_historial` WRITE;
/*!40000 ALTER TABLE `chat_historial` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_historial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentarios`
--

DROP TABLE IF EXISTS `comentarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comentarios` (
  `id_comentario` int NOT NULL AUTO_INCREMENT,
  `id_restaurante` int NOT NULL,
  `id_producto` int DEFAULT NULL COMMENT 'Sobre qué producto es el comentario',
  `calificacion` tinyint DEFAULT NULL COMMENT 'Ej: 1-5 estrellas',
  `comentario` text,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_comentario`),
  KEY `fk_comentarios_restaurante` (`id_restaurante`),
  KEY `fk_comentarios_producto` (`id_producto`),
  CONSTRAINT `fk_comentarios_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_comentarios_restaurante` FOREIGN KEY (`id_restaurante`) REFERENCES `restaurante` (`id_restaurante`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentarios`
--

LOCK TABLES `comentarios` WRITE;
/*!40000 ALTER TABLE `comentarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `comentarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config_gastos_diarios`
--

DROP TABLE IF EXISTS `config_gastos_diarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `config_gastos_diarios` (
  `id_gasto_fijo` int NOT NULL AUTO_INCREMENT,
  `id_restaurante` int NOT NULL,
  `concepto` varchar(100) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_gasto_fijo`),
  KEY `id_restaurante` (`id_restaurante`),
  CONSTRAINT `config_gastos_diarios_ibfk_1` FOREIGN KEY (`id_restaurante`) REFERENCES `restaurante` (`id_restaurante`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config_gastos_diarios`
--

LOCK TABLES `config_gastos_diarios` WRITE;
/*!40000 ALTER TABLE `config_gastos_diarios` DISABLE KEYS */;
INSERT INTO `config_gastos_diarios` VALUES (7,1,'luz',100.00);
/*!40000 ALTER TABLE `config_gastos_diarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empleados`
--

DROP TABLE IF EXISTS `empleados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleados` (
  `id_empleado` int NOT NULL AUTO_INCREMENT,
  `id_restaurante` int NOT NULL,
  `nombre_empleado` varchar(60) NOT NULL,
  `rol` varchar(45) NOT NULL,
  `sueldo` decimal(10,2) NOT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_empleado`),
  KEY `fk_empleados_restaurante` (`id_restaurante`),
  CONSTRAINT `fk_empleados_restaurante` FOREIGN KEY (`id_restaurante`) REFERENCES `restaurante` (`id_restaurante`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleados`
--

LOCK TABLES `empleados` WRITE;
/*!40000 ALTER TABLE `empleados` DISABLE KEYS */;
INSERT INTO `empleados` VALUES (1,1,'pepe','Cocinero',10000.00,'activo');
/*!40000 ALTER TABLE `empleados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingredientes`
--

DROP TABLE IF EXISTS `ingredientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredientes` (
  `id_ingrediente` int NOT NULL AUTO_INCREMENT,
  `id_restaurante` int NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `unidad_medida` varchar(20) NOT NULL COMMENT 'Ej: gr, ml, pza',
  `costo_unitario` decimal(15,6) NOT NULL DEFAULT '0.000000',
  `stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `cantidad_por_unidad` decimal(10,2) DEFAULT '1.00' COMMENT 'Cuanto trae el envase (ej. 3750 ml)',
  `dias_caducidad_estimado` int DEFAULT NULL COMMENT 'Días promedio que dura este producto para auto-calcular caducidad al comprar',
  PRIMARY KEY (`id_ingrediente`),
  UNIQUE KEY `idx_restaurante_nombre_ing` (`id_restaurante`,`nombre`),
  CONSTRAINT `fk_ingredientes_restaurante` FOREIGN KEY (`id_restaurante`) REFERENCES `restaurante` (`id_restaurante`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredientes`
--

LOCK TABLES `ingredientes` WRITE;
/*!40000 ALTER TABLE `ingredientes` DISABLE KEYS */;
INSERT INTO `ingredientes` VALUES (1,1,'Leche','ml',0.035000,79976.00,'activo',1000.00,NULL);
/*!40000 ALTER TABLE `ingredientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lotes_ingredientes`
--

DROP TABLE IF EXISTS `lotes_ingredientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lotes_ingredientes` (
  `id_lote` int NOT NULL AUTO_INCREMENT,
  `id_ingrediente` int NOT NULL,
  `id_restaurante` int NOT NULL,
  `cantidad_inicial` decimal(10,2) NOT NULL COMMENT 'Lo que se compró originalmente',
  `cantidad_actual` decimal(10,2) NOT NULL COMMENT 'Lo que queda de este lote',
  `fecha_compra` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_caducidad` date NOT NULL,
  `estado` enum('disponible','agotado','caducado','desechado') NOT NULL DEFAULT 'disponible',
  PRIMARY KEY (`id_lote`),
  KEY `fk_lote_ingrediente` (`id_ingrediente`),
  KEY `fk_lote_restaurante` (`id_restaurante`),
  CONSTRAINT `fk_lote_ingrediente` FOREIGN KEY (`id_ingrediente`) REFERENCES `ingredientes` (`id_ingrediente`) ON DELETE CASCADE,
  CONSTRAINT `fk_lote_restaurante` FOREIGN KEY (`id_restaurante`) REFERENCES `restaurante` (`id_restaurante`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lotes_ingredientes`
--

LOCK TABLES `lotes_ingredientes` WRITE;
/*!40000 ALTER TABLE `lotes_ingredientes` DISABLE KEYS */;
/*!40000 ALTER TABLE `lotes_ingredientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `m_usuarios`
--

DROP TABLE IF EXISTS `m_usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `id_restaurante` int NOT NULL,
  `nombre_usuario` varchar(50) NOT NULL,
  `correo_usuario` varchar(60) NOT NULL,
  `contra_hash` varchar(255) NOT NULL,
  `rol` enum('dueño','cocinero','mesero') NOT NULL DEFAULT 'cocinero',
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `correo_usuario_UNIQUE` (`correo_usuario`),
  KEY `fk_usuarios_restaurante` (`id_restaurante`),
  CONSTRAINT `fk_usuarios_restaurante` FOREIGN KEY (`id_restaurante`) REFERENCES `restaurante` (`id_restaurante`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `m_usuarios`
--

LOCK TABLES `m_usuarios` WRITE;
/*!40000 ALTER TABLE `m_usuarios` DISABLE KEYS */;
INSERT INTO `m_usuarios` VALUES (1,1,'angel','hola@gmail.com','$2b$10$EE/JO6m5gtqJ2zTPmjc65.JpKSugGU9E8/.mrwXc4Bq9GRk7os4JO','dueño','activo'),(2,1,'mesero','mesero@gmail.com','$2b$10$LK84QsJTVW/9e93XQeYRGuj6C5ajVbgYHPlxQVWJa5rx9ajE0PwpW','cocinero','activo'),(3,1,'mesero','mesero2@gmail.com','$2b$10$bh8aemFEiH8x2pDjwfT9HeJLrmLA2PFx4HbQ2I5lkWJ7g1wtRmH0O','mesero','activo'),(4,1,'emilio','emilio@restaurante.com','$2b$10$qV5uKzZxZqZxZqZxZqZxZu5Z5qV5uKzZxZqZxZqZxZqZxZqZxZqZxZq','mesero','activo');
/*!40000 ALTER TABLE `m_usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mesas`
--

DROP TABLE IF EXISTS `mesas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mesas` (
  `id_mesa` int NOT NULL AUTO_INCREMENT,
  `id_restaurante` int NOT NULL,
  `numero_mesa` varchar(50) NOT NULL,
  `estado` enum('libre','ocupada') NOT NULL DEFAULT 'libre',
  `codigo_sesion` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id_mesa`),
  KEY `fk_mesas_restaurante` (`id_restaurante`),
  CONSTRAINT `fk_mesas_restaurante` FOREIGN KEY (`id_restaurante`) REFERENCES `restaurante` (`id_restaurante`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mesas`
--

LOCK TABLES `mesas` WRITE;
/*!40000 ALTER TABLE `mesas` DISABLE KEYS */;
INSERT INTO `mesas` VALUES (6,1,'Mesa 3','libre',NULL),(7,1,'Mesa 1','libre',NULL),(8,1,'Mesa 2','ocupada','862'),(9,1,'Barra 8','ocupada','649');
/*!40000 ALTER TABLE `mesas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_financieros`
--

DROP TABLE IF EXISTS `movimientos_financieros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_financieros` (
  `id_movimiento` int NOT NULL AUTO_INCREMENT,
  `id_restaurante` int NOT NULL,
  `tipo` enum('ingreso','egreso') NOT NULL,
  `categoria` enum('nomina','insumos','servicios','otros','venta') DEFAULT 'otros',
  `monto` decimal(12,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_movimiento`),
  KEY `fk_movimientos_restaurante` (`id_restaurante`),
  CONSTRAINT `fk_movimientos_restaurante` FOREIGN KEY (`id_restaurante`) REFERENCES `restaurante` (`id_restaurante`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_financieros`
--

LOCK TABLES `movimientos_financieros` WRITE;
/*!40000 ALTER TABLE `movimientos_financieros` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimientos_financieros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedido_detalles`
--

DROP TABLE IF EXISTS `pedido_detalles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedido_detalles` (
  `id_pedido_detalle` int NOT NULL AUTO_INCREMENT,
  `id_pedido` int NOT NULL,
  `id_producto` int DEFAULT NULL,
  `cantidad` int NOT NULL DEFAULT '1',
  `precio_en_pedido` decimal(10,2) NOT NULL COMMENT 'Congela el precio al momento de la compra',
  PRIMARY KEY (`id_pedido_detalle`),
  UNIQUE KEY `idx_pedido_producto` (`id_pedido`,`id_producto`),
  KEY `fk_detalle_producto` (`id_producto`),
  CONSTRAINT `fk_detalle_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedido_detalles`
--

LOCK TABLES `pedido_detalles` WRITE;
/*!40000 ALTER TABLE `pedido_detalles` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedido_detalles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id_pedido` int NOT NULL AUTO_INCREMENT,
  `id_restaurante` int NOT NULL,
  `mesa` varchar(50) NOT NULL,
  `responsable_pedido` varchar(100) DEFAULT NULL COMMENT 'Nombre del cliente',
  `total_calculado` decimal(10,2) NOT NULL,
  `estado` enum('sin ver','en proceso','completado','por_pagar','cancelado','inactivo','archivado') NOT NULL DEFAULT 'sin ver',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `solicito_pago` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 si el cliente ya aviso que pago',
  `metodo_pago` enum('efectivo','tarjeta') DEFAULT NULL COMMENT 'Se llena cuando el cliente pide la cuenta',
  `fecha_en_proceso` datetime DEFAULT NULL COMMENT 'Cuando el cocinero empieza',
  `fecha_completado` datetime DEFAULT NULL COMMENT 'Cuando el plato está listo',
  `fecha_pago` datetime DEFAULT NULL COMMENT 'Cuando el cliente paga',
  PRIMARY KEY (`id_pedido`),
  KEY `fk_pedidos_restaurante` (`id_restaurante`),
  CONSTRAINT `fk_pedidos_restaurante` FOREIGN KEY (`id_restaurante`) REFERENCES `restaurante` (`id_restaurante`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id_producto` int NOT NULL AUTO_INCREMENT,
  `id_restaurante` int NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` text,
  `precio_venta` decimal(10,2) NOT NULL,
  `tipo` enum('platillo','bebida','postre') NOT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `imagen` longtext,
  PRIMARY KEY (`id_producto`),
  UNIQUE KEY `idx_restaurante_nombre_prod` (`id_restaurante`,`nombre`),
  CONSTRAINT `fk_productos_restaurante` FOREIGN KEY (`id_restaurante`) REFERENCES `restaurante` (`id_restaurante`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,1,'Taco de Prueba','Delicioso',20.00,'platillo','inactivo',NULL),(2,1,'Refresco','Bien frio',25.00,'bebida','inactivo',NULL),(3,1,'Leche entera','ayuda',235.00,'platillo','activo',NULL);
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recetas`
--

DROP TABLE IF EXISTS `recetas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recetas` (
  `id_producto` int NOT NULL,
  `id_ingrediente` int NOT NULL,
  `cantidad_usada` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_producto`,`id_ingrediente`),
  KEY `fk_receta_ingrediente` (`id_ingrediente`),
  CONSTRAINT `fk_receta_ingrediente` FOREIGN KEY (`id_ingrediente`) REFERENCES `ingredientes` (`id_ingrediente`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_receta_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recetas`
--

LOCK TABLES `recetas` WRITE;
/*!40000 ALTER TABLE `recetas` DISABLE KEYS */;
INSERT INTO `recetas` VALUES (3,1,24.00);
/*!40000 ALTER TABLE `recetas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurante`
--

DROP TABLE IF EXISTS `restaurante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurante` (
  `id_restaurante` int NOT NULL AUTO_INCREMENT,
  `nombre_restaurante` varchar(100) NOT NULL,
  `codigo_acceso` varchar(20) DEFAULT 'YaYoungFuture5',
  PRIMARY KEY (`id_restaurante`),
  UNIQUE KEY `nombre_restaurante_UNIQUE` (`nombre_restaurante`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurante`
--

LOCK TABLES `restaurante` WRITE;
/*!40000 ALTER TABLE `restaurante` DISABLE KEYS */;
INSERT INTO `restaurante` VALUES (1,'angel\'s Restaurant','YaYoungFuture5');
/*!40000 ALTER TABLE `restaurante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('ATVvLa8ctTmbT6GX8Br5aLuNM_ygMOdU',1769018321,'{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2026-01-21T17:21:33.270Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"restauranteContexto\":1,\"nombreRestauranteContexto\":\"angel\'s Restaurant\",\"userId\":1,\"restauranteId\":1,\"nombreUsuario\":\"angel\",\"rol\":\"dueño\"}');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'ya'
--

--
-- Dumping routines for database 'ya'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_InsertarPedidosDePrueba2` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_InsertarPedidosDePrueba2`(IN num_pedidos INT)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE total_tacos INT;
    DECLARE total_aguas INT;
    DECLARE precio_taco DECIMAL(10,2) DEFAULT 18.00;
    DECLARE precio_agua DECIMAL(10,2) DEFAULT 25.00;
    DECLARE total_calculado_pedido DECIMAL(10,2);
    DECLARE pedido_id INT;
    DECLARE dias_aleatorios INT;
    DECLARE horas_aleatorias INT;
    DECLARE mesa_aleatoria INT;

    WHILE i < num_pedidos DO
        -- 1. Generar datos aleatorios
        SET dias_aleatorios = FLOOR(RAND() * 30); -- Pedidos en los últimos 30 días
        SET horas_aleatorias = FLOOR(RAND() * 24);
        SET mesa_aleatoria = FLOOR(1 + RAND() * 10); -- Mesas 1 a 10
        SET total_tacos = FLOOR(1 + RAND() * 3); -- 1, 2, o 3 tacos
        SET total_aguas = FLOOR(1 + RAND() * 2); -- 1 o 2 aguas
        SET total_calculado_pedido = (total_tacos * precio_taco) + (total_aguas * precio_agua);

        -- 2. Insertar el pedido principal
        INSERT INTO pedidos (
            id_restaurante, 
            mesa, 
            responsable_pedido, 
            total_calculado, 
            estado, 
            fecha_creacion
        ) 
        VALUES (
            1,                                  -- id_restaurante
            CONCAT('Mesa ', mesa_aleatoria),    -- Mesa (ej: 'Mesa 5')
            'Cliente de Prueba',                -- responsable
            total_calculado_pedido,             -- total
            'completado',                       -- estado
            NOW() - INTERVAL dias_aleatorios DAY - INTERVAL horas_aleatorias HOUR -- fecha
        );

        -- 3. Obtener el ID del pedido que acabamos de crear
        SET pedido_id = LAST_INSERT_ID();

        -- 4. Insertar los detalles
        -- Tacos (id_producto = 3)
        INSERT INTO pedido_detalles (id_pedido, id_producto, cantidad, precio_en_pedido)
        VALUES (pedido_id, 3, total_tacos, precio_taco);

        -- Aguas (id_producto = 2)
        INSERT INTO pedido_detalles (id_pedido, id_producto, cantidad, precio_en_pedido)
        VALUES (pedido_id, 2, total_aguas, precio_agua);

        SET i = i + 1;
    END WHILE;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-20 11:21:03
