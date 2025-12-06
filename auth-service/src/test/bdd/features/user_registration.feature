Feature: Регистрация пользователя
  Как новый пользователь
  Я хочу зарегистрироваться в системе
  Чтобы получить доступ к функционалу приложения

  Background:
    Given система аутентификации запущена
    And база данных пользователей пуста

  Rule: Валидация вводимых данных
    Пользователь должен предоставить корректные данные для успешной регистрации

  Scenario Outline: Успешная регистрация нового пользователя
    Given я заполняю форму регистрации с данными:
      | Поле     | Значение              |
      | Имя      | <name>                |
      | Email    | <email>               |
      | Пароль   | <password>            |
    When я отправляю форму регистрации
    Then я должен получить JWT токен
    And пользователь должен быть сохранен в базе данных
    And в ответе должен быть объект пользователя без пароля

    Examples:
      | name          | email               | password         |
      | Иван Иванов   | ivan@example.com    | Password123      |
      | Мария Петрова | maria@example.com   | SecurePass456    |
      | Алексей       | alex@example.com    | StrongPass789    |

  Scenario: Попытка регистрации с уже существующим email
    Given пользователь с email "test@example.com" уже зарегистрирован
    When я пытаюсь зарегистрироваться с email "test@example.com"
    Then я должен получить ошибку конфликта
    And система должна вернуть сообщение "User with this email already exists"

  Scenario: Регистрация с некорректным email
    Given я ввожу некорректный email "<email>"
    When я пытаюсь зарегистрироваться
    Then я должен получить ошибку валидации
    And система должна вернуть сообщение "Invalid email format"

    Examples:
      | email               |
      | invalid-email       |
      | test@               |
      | @example.com        |
      | test@example        |

  Scenario: Регистрация с паролем недопустимой длины
    Given я ввожу пароль длиной <length> символов
    When я пытаюсь зарегистрироваться
    Then я должен получить ошибку валидации пароля

    Examples:
      | length | expected |
      | 3      | fail     |
      | 4      | success  |
      | 20     | success  |
      | 21     | fail     |