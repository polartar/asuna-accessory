-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `nonce` VARCHAR(191) NULL,
    `address` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_address_key`(`address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `expires` DATETIME(3) NULL,
    `user_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sessions_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asunas` (
    `id` INTEGER NOT NULL,
    `token_uri` VARCHAR(191) NOT NULL,
    `metadata` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accessories` (
    `id` INTEGER NOT NULL,
    `token_uri` VARCHAR(191) NOT NULL,
    `metadata` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accessory_to_asuna` (
    `accessory_id` INTEGER NOT NULL,
    `asuna_id` INTEGER NULL,

    INDEX `accessory_to_asuna_asuna_id_idx`(`asuna_id`),
    PRIMARY KEY (`accessory_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `action_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accessory_id` INTEGER NOT NULL,
    `asuna_id` INTEGER NOT NULL,
    `req_address` VARCHAR(191) NOT NULL,
    `action_type` ENUM('Equip', 'Unequip') NOT NULL,
    `txn_state` ENUM('Pending', 'Failed', 'Success') NOT NULL,
    `txn_hash` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `action_requests_accessory_id_idx`(`accessory_id`),
    INDEX `action_requests_asuna_id_idx`(`asuna_id`),
    INDEX `action_requests_asuna_id_action_type_txn_state_idx`(`asuna_id`, `action_type`, `txn_state`),
    UNIQUE INDEX `action_requests_txn_hash_accessory_id_asuna_id_action_type_key`(`txn_hash`, `accessory_id`, `asuna_id`, `action_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `action_prices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action_type` ENUM('Equip', 'Unequip') NOT NULL,
    `cost` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `action_prices_action_type_key`(`action_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `balance` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `wallets_user_id_key`(`user_id`),
    INDEX `wallets_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `charges` (
    `id` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `hosted_url` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
