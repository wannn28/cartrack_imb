package configs

import (
	"errors"
	"fmt"

	"github.com/caarlos0/env/v6"
	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	ENV            string         `env:"ENV" envDefault:"development" mapstructure:"ENV"`
	PORT           string         `env:"PORT" envDefault:"8081" mapstructure:"PORT"`
	PostgresConfig PostgresConfig `envPrefix:"POSTGRES_" mapstructure:"POSTGRES"`
	JWT            JWTConfig      `envPrefix:"JWT_" mapstructure:"JWT"`
	MigrationPath  string         `env:"MIGRATION_PATH" envDefault:"db/migrations" mapstructure:"MIGRATION_PATH"`
}

type JWTConfig struct {
	SecretKey string `env:"SECRET_KEY" envDefault:"secret" mapstructure:"SECRET_KEY"`
}

type PostgresConfig struct {
	Host     string `env:"HOST" envDefault:"localhost" mapstructure:"HOST"`
	Port     string `env:"PORT" envDefault:"5432" mapstructure:"PORT"`
	User     string `env:"USER" envDefault:"postgres" mapstructure:"USER"`
	Password string `env:"PASSWORD" envDefault:"postgres" mapstructure:"PASSWORD"`
	Database string `env:"DATABASE" envDefault:"postgres" mapstructure:"DATABASE"`
}

// GetDatabaseURL returns the PostgreSQL connection string
func (p PostgresConfig) GetDatabaseURL() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		p.User, p.Password, p.Host, p.Port, p.Database)
}

func NewConfig(envPath string) (*Config, error) {
	err := godotenv.Load(envPath)
	if err != nil {
		return nil, errors.New("failed to load env")
	}

	cfg := new(Config)
	err = env.Parse(cfg)
	if err != nil {
		return nil, errors.New("failed to parse env")
	}
	return cfg, nil
}

func NewConfigYaml(path string) (*Config, error) {
	viper.SetConfigType("yaml")
	viper.SetConfigFile(path)

	err := viper.ReadInConfig()
	if err != nil {
		return nil, errors.New("failed to load config " + err.Error())
	}

	cfg := new(Config)
	err = viper.Unmarshal(cfg)

	if err != nil {
		return nil, errors.New("failed to parse config " + err.Error())
	}

	return cfg, nil
}
