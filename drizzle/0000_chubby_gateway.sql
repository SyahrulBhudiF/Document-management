CREATE TABLE "users"
(
    "id"            uuid PRIMARY KEY DEFAULT uuid_generate_v4
                                             () NOT NULL,
    "name"          varchar(100)                NOT NULL,
    "email"         varchar(100)                NOT NULL,
    "password"      varchar(255)     DEFAULT NULL,
    "emailVerified" timestamp        DEFAULT NULL,
    "loginAt"       timestamp        DEFAULT NULL,
    "createdAt"     date             DEFAULT now
                                             (),
    "updatedAt"     date             DEFAULT now
                                             (),
    "deletedAt"     date             DEFAULT NULL,
    CONSTRAINT "users_id_unique" UNIQUE ("id"),
    CONSTRAINT "users_email_unique" UNIQUE ("email")
);
