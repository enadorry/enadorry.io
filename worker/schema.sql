CREATE TABLE `access_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL
);

CREATE TABLE `access_totals` (
	`name` text PRIMARY KEY NOT NULL,
	`total` integer DEFAULT 0 NOT NULL
);

CREATE TABLE `social_settings` (
	`name` text PRIMARY KEY NOT NULL,
	`x_visible` integer DEFAULT true NOT NULL,
	`instagram_visible` integer DEFAULT true NOT NULL
);

CREATE TABLE `spotify_account` (
	`name` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`token_box` text,
	`feed` text DEFAULT '{"items":[]}' NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'not_connected' NOT NULL
);

CREATE TABLE `spotify_oauth` (
	`state` text PRIMARY KEY NOT NULL,
	`verifier_box` text NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`redirect_uri` text NOT NULL,
	`expires_at` integer NOT NULL
);

CREATE TABLE `note_cache` (
	`name` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`fetched_at` integer NOT NULL
);

CREATE TABLE `note_texts` (
	`id` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`published` integer DEFAULT true NOT NULL
);
