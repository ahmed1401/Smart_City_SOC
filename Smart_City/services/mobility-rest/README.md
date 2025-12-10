# Mobility REST Service

Implémentation Spring Boot de l'API REST décrite dans `contracts/openapi/mobility-openapi.yaml`. Les réservations (`bookings`) sont stockées dans PostgreSQL via Spring Data JPA (`BookingEntity`). Le script `src/main/resources/schema.sql` est exécuté à chaque démarrage (`spring.sql.init.mode=always`) et `spring.jpa.defer-datasource-initialization=true` garantit que la table existe avant les premières requêtes.

## Démarrage local
```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/mobility
export SPRING_DATASOURCE_USERNAME=mobility
export SPRING_DATASOURCE_PASSWORD=mobility
mvn spring-boot:run
```

## Variables d'environnement
- `SPRING_DATASOURCE_URL` (ex: `jdbc:postgresql://localhost:5432/mobility`)
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_SQL_INIT_MODE` (optionnel, `always` par défaut)
- `SPRING_JPA_DEFER_DATASOURCE_INITIALIZATION=true` pour laisser Spring appliquer `schema.sql` avant Hibernate

## Docker
```bash
docker build -t smartcity/mobility-rest:dev .
docker run -p 8080:8080 smartcity/mobility-rest:dev
```

## Endpoints
Voir Swagger UI : `/mobility/swagger-ui.html`.

## Dépannage
- **`connect() failed (111: Connection refused)` côté Kong** : attendre que le service ait terminé son bootstrap (log `Tomcat started on port 8080`).
- **`relation "bookings" does not exist`** : confirmer que la base Postgres est joignable et que `SPRING_SQL_INIT_MODE=always` n'a pas été désactivé.
