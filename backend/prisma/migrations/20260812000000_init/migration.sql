CREATE TABLE `users` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(120) NULL,
  `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pipeline_stages` (
  `key` VARCHAR(40) NOT NULL,
  `label` VARCHAR(80) NOT NULL,
  `sort_order` INTEGER NOT NULL,
  `is_won` BOOLEAN NOT NULL DEFAULT false,
  `is_closed` BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `clients` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `stage_key` VARCHAR(40) NOT NULL DEFAULT 'new_lead',
  `name` VARCHAR(120) NOT NULL,
  `company` VARCHAR(160) NOT NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(40) NULL,
  `deal_value` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `clients_user_id_idx` (`user_id`),
  INDEX `clients_user_id_stage_key_idx` (`user_id`, `stage_key`),
  INDEX `clients_user_id_updated_at_idx` (`user_id`, `updated_at`),
  INDEX `clients_company_idx` (`company`),
  CONSTRAINT `clients_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `clients_stage_key_fkey` FOREIGN KEY (`stage_key`) REFERENCES `pipeline_stages`(`key`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `client_notes` (
  `id` VARCHAR(191) NOT NULL,
  `client_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `client_notes_client_id_idx` (`client_id`),
  INDEX `client_notes_user_id_created_at_idx` (`user_id`, `created_at`),
  CONSTRAINT `client_notes_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `client_notes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `activity_logs` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `client_id` VARCHAR(191) NULL,
  `action` VARCHAR(80) NOT NULL,
  `entity` VARCHAR(80) NOT NULL,
  `entity_id` VARCHAR(191) NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `activity_logs_user_id_created_at_idx` (`user_id`, `created_at`),
  INDEX `activity_logs_client_id_idx` (`client_id`),
  CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `activity_logs_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `pipeline_stages` (`key`, `label`, `sort_order`, `is_won`, `is_closed`) VALUES
  ('new_lead', 'New Lead', 10, false, false),
  ('contacted', 'Contacted', 20, false, false),
  ('proposal', 'Proposal', 30, false, false),
  ('negotiation', 'Negotiation', 40, false, false),
  ('won', 'Won', 50, true, true),
  ('lost', 'Lost', 60, false, true);
