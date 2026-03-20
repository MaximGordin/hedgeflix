# Декораторы в TypeScript и NestJS

## Что это / Какую проблему решает

Декоратор — это **функция**, которая добавляет поведение или метаданные к классу, методу, свойству или параметру, не изменяя исходный код. Синтаксис — символ `@` перед объявлением.

**Зачем нужны:**
- Убирают повторяющийся boilerplate-код (авторизация, валидация, логирование)
- Делают код декларативным — ты *описываешь*, что должно произойти, а не *как*
- Позволяют фреймворкам (NestJS) автоматически конфигурировать приложение по метаданным

```ts
// Без декораторов — императивно:
app.get('/movies', authMiddleware, cacheMiddleware, handler);

// С декораторами — декларативно:
@UseGuards(AuthGuard)
@CacheKey('movies')
@Get('movies')
findAll() {}
```

---

## Как это работает под капотом

### Два стандарта декораторов

В TypeScript существуют **два** варианта декораторов:

| | Legacy (experimental) | TC39 Stage 3 |
|---|---|---|
| Флаг | `experimentalDecorators: true` | Без флага (TS 5.0+) |
| Метаданные | `reflect-metadata` + `emitDecoratorMetadata` | `Symbol.metadata` (отдельный proposal) |
| NestJS | **Использует этот** | Пока не поддерживает |

> **Важно:** NestJS (на 2025–2026) работает на **legacy** декораторах. Поэтому в `tsconfig.json` всегда стоит `"experimentalDecorators": true`.

### Что происходит при компиляции

Когда TypeScript видит декоратор, он компилирует его в вызов helper-функции `__decorate`:

```ts
// Исходный TypeScript
@Injectable()
class MoviesService {}

// Скомпилированный JavaScript (упрощённо)
MoviesService = __decorate([
  Injectable()
], MoviesService);
```

### Reflect Metadata — ключевой механизм

NestJS хранит всю конфигурацию в метаданных через библиотеку `reflect-metadata`. Это работает как скрытый key-value store, привязанный к классам и методам.

```
┌─────────────────────────────────────────────┐
│  @Controller('movies')                      │
│       │                                     │
│       ▼                                     │
│  Reflect.defineMetadata('path', 'movies',   │
│                          MoviesController)   │
│                                             │
│  При старте NestJS:                         │
│  Reflect.getMetadata('path',                │
│                       MoviesController)      │
│  → 'movies'                                 │
└─────────────────────────────────────────────┘
```

Три автоматических ключа метаданных (при `emitDecoratorMetadata: true`):

| Ключ | Что содержит |
|---|---|
| `design:type` | Тип свойства/метода |
| `design:paramtypes` | Типы параметров метода |
| `design:returntype` | Тип возвращаемого значения |

Именно благодаря `design:paramtypes` работает **Dependency Injection** в NestJS — фреймворк знает, какие зависимости нужно инжектировать в конструктор.

```ts
@Injectable()
class MoviesController {
  // NestJS читает design:paramtypes → [MoviesService]
  // и автоматически создаёт и передаёт экземпляр MoviesService
  constructor(private moviesService: MoviesService) {}
}
```

---

## Базовое использование

### 5 видов декораторов в TypeScript

```ts
// 1. Декоратор класса
// Получает: constructor функцию
@Controller('movies')
class MoviesController {}

// 2. Декоратор метода
// Получает: target (прототип), propertyKey (имя метода), descriptor
class MoviesController {
  @Get(':id')
  findOne() {}
}

// 3. Декоратор свойства
// Получает: target (прототип), propertyKey (имя свойства)
class Movie {
  @Column()
  title: string;
}

// 4. Декоратор параметра
// Получает: target (прототип), propertyKey (имя метода), parameterIndex
class MoviesController {
  findOne(@Param('id') id: string) {}
}

// 5. Декоратор accessor (TS 5.0+ / TC39)
class Movie {
  @MaxLength(255)
  accessor title: string;
}
```

### Написание простого декоратора

```ts
// Декоратор класса — принимает конструктор
function Sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@Sealed
class Movie {}

// Фабрика декораторов — функция, возвращающая декоратор
// Нужна, когда декоратору передаются аргументы: @Something(args)
function Log(prefix: string) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      console.log(`[${prefix}] ${key} called with`, args);
      return original.apply(this, args);
    };
  };
}

class MoviesService {
  @Log('movies')
  findAll() { /* ... */ }
}
```

### Порядок выполнения

Декораторы применяются **снизу вверх**, **справа налево**:

```ts
@A
@B
class Foo {
  @C
  @D
  method(@E param: string) {}
}

// Порядок: E → D → C → B → A
// (параметры → методы → класс, снизу вверх)
```

---

## Практические примеры (NestJS / Hedgeflix)

### Основные декораторы NestJS

```ts
// ===== Структура приложения =====

@Module({
  imports: [PrismaModule],        // зависимости модуля
  controllers: [MoviesController], // контроллеры
  providers: [MoviesService],      // сервисы (DI providers)
  exports: [MoviesService],        // что доступно другим модулям
})
export class MoviesModule {}

@Controller('movies') // базовый путь: /movies
export class MoviesController {
  constructor(private moviesService: MoviesService) {}

  // ===== HTTP-методы =====

  @Get()                    // GET /movies
  findAll(@Query() query: FindMoviesDto) {
    return this.moviesService.findAll(query);
  }

  @Get(':id')               // GET /movies/123
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.findOne(id);
  }

  @Post()                   // POST /movies
  @HttpCode(201)            // код ответа (по умолчанию 200 для POST)
  create(@Body() dto: CreateMovieDto) {
    return this.moviesService.create(dto);
  }

  @Patch(':id')             // PATCH /movies/123
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMovieDto,
  ) {
    return this.moviesService.update(id, dto);
  }

  @Delete(':id')            // DELETE /movies/123
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.remove(id);
  }
}

@Injectable() // помечает класс как DI-провайдер
export class MoviesService {
  constructor(private prisma: PrismaService) {}
}
```

### Декораторы для извлечения данных из запроса

```ts
@Get('search')
search(
  @Query('q') query: string,           // ?q=inception → 'inception'
  @Query('page', ParseIntPipe) page: number, // ?page=2 → 2

  @Headers('accept-language') lang: string, // заголовок
  @Ip() ip: string,                         // IP клиента
  @Req() req: Request,                      // весь объект запроса (избегай)
) {}
```

### Кастомный декоратор параметра — `@CurrentUser()`

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Если передан ключ — вернуть конкретное поле
    // @CurrentUser('email') → user.email
    return data ? user?.[data] : user;
  },
);

// Использование:
@Get('profile')
@UseGuards(AuthGuard)
getProfile(@CurrentUser() user: User) {
  return user;
}

@Get('my-email')
@UseGuards(AuthGuard)
getEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

### Кастомный декоратор с метаданными — `@Roles()`

```ts
import { SetMetadata } from '@nestjs/common';

// Шаг 1: Декоратор, который сохраняет метаданные
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Шаг 2: Guard, который читает эти метаданные
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Reflector читает метаданные, установленные @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Шаг 3: Использование
@Post()
@Roles('admin')
@UseGuards(AuthGuard, RolesGuard)
create(@Body() dto: CreateMovieDto) {}
```

### Композиция декораторов — `applyDecorators()`

```ts
import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

// Объединяем несколько декораторов в один
export function Auth(...roles: string[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}

// Вместо 4 декораторов — один:
@Post()
@Auth('admin')
create(@Body() dto: CreateMovieDto) {}
```

---

## Продвинутые паттерны / Pro tips

### 1. Декоратор + Interceptor = кеширование

```ts
// Декоратор задаёт ключ кеша
export const CacheKey = (key: string) => SetMetadata('cacheKey', key);
export const CacheTTL = (ttl: number) => SetMetadata('cacheTTL', ttl);

// Interceptor читает его и кеширует результат
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private cache: CacheService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const key = this.reflector.get<string>('cacheKey', context.getHandler());
    if (!key) return next.handle();

    const cached = await this.cache.get(key);
    if (cached) return of(cached);

    return next.handle().pipe(
      tap((data) => {
        const ttl = this.reflector.get<number>('cacheTTL', context.getHandler()) ?? 60;
        this.cache.set(key, data, ttl);
      }),
    );
  }
}

// Использование
@Get()
@CacheKey('all-movies')
@CacheTTL(300)
@UseInterceptors(CacheInterceptor)
findAll() {}
```

### 2. Декоратор для измерения времени выполнения

```ts
export function Measure(): MethodDecorator {
  return (target, key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      const result = await original.apply(this, args);
      const duration = (performance.now() - start).toFixed(2);
      console.log(`${String(key)} executed in ${duration}ms`);
      return result;
    };
  };
}

// Использование
@Injectable()
export class MoviesService {
  @Measure()
  async findAll() { /* ... */ }
}
```

### 3. Reflector — чтение метаданных на нескольких уровнях

```ts
// getAllAndOverride — берёт первое найденное значение (метод > класс)
const roles = this.reflector.getAllAndOverride(ROLES_KEY, [
  context.getHandler(), // сначала проверяет метод
  context.getClass(),   // потом класс
]);

// getAllAndMerge — объединяет значения с обоих уровней
const roles = this.reflector.getAllAndMerge(ROLES_KEY, [
  context.getHandler(),
  context.getClass(),
]);
// Класс: @Roles('user'), Метод: @Roles('admin') → ['admin', 'user']
```

### 4. Декоратор для Swagger-документации в одну строку

```ts
export function ApiPaginatedResponse(model: Type) {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          },
          total: { type: 'number' },
          page: { type: 'number' },
          limit: { type: 'number' },
        },
      },
    }),
    ApiQuery({ name: 'page', required: false }),
    ApiQuery({ name: 'limit', required: false }),
  );
}

@Get()
@ApiPaginatedResponse(MovieDto)
findAll() {}
```

---

## Реальные реализации декораторов NestJS (исходный код)

Все декораторы NestJS делают по сути одно и то же — вызывают `Reflect.defineMetadata()`. Вся реальная работа происходит потом, когда NestJS при старте обходит классы и читает эти метаданные.

### 1. `@SetMetadata()` — самый простой

```ts
// Реальная реализация из @nestjs/common
// https://github.com/nestjs/nest/blob/master/packages/common/decorators/core/set-metadata.decorator.ts

export function SetMetadata(key: string, value: any) {
  // Фабрика: возвращает декоратор
  return (target: object | Function, propertyKey?: string | symbol) => {
    // Если применён к методу — сохраняем на метод
    // Если к классу — сохраняем на класс
    if (propertyKey) {
      Reflect.defineMetadata(key, value, target, propertyKey);
    } else {
      Reflect.defineMetadata(key, value, target);
    }
  };
}

// Использование:
@SetMetadata('roles', ['admin'])
create() {}

// Потом в Guard:
Reflect.getMetadata('roles', handler); // → ['admin']
```

Буквально одна строка — записать значение в хранилище метаданных.

### 2. `@Injectable()` — основа DI

```ts
// Реальная реализация из @nestjs/common
// https://github.com/nestjs/nest/blob/master/packages/common/decorators/core/injectable.decorator.ts

import { INJECTABLE_WATERMARK, SCOPE_OPTIONS_METADATA } from '../../constants';

export function Injectable(options?: { scope?: Scope }): ClassDecorator {
  return (target: Function) => {
    // Помечаем класс как "injectable" — просто флаг
    Reflect.defineMetadata(INJECTABLE_WATERMARK, true, target);

    // Сохраняем scope (DEFAULT, REQUEST, TRANSIENT)
    Reflect.defineMetadata(SCOPE_OPTIONS_METADATA, options, target);
  };
}

// INJECTABLE_WATERMARK = '__injectable__'
// Это просто строка-ключ

// А вот магия DI происходит НЕ здесь, а благодаря emitDecoratorMetadata.
// TypeScript автоматически добавляет:
//
//   Reflect.metadata('design:paramtypes', [PrismaService])
//
// NestJS потом делает:
//   const deps = Reflect.getMetadata('design:paramtypes', MoviesService);
//   // → [PrismaService]
//   // Окей, нужно создать PrismaService и передать в конструктор
```

### 3. `@Get()`, `@Post()` и т.д. — маршрутизация

```ts
// Реальная реализация из @nestjs/common
// https://github.com/nestjs/nest/blob/master/packages/common/decorators/http/request-mapping.decorator.ts

import { RequestMethod } from '../../enums';
import { PATH_METADATA, METHOD_METADATA } from '../../constants';

// Универсальная фабрика для всех HTTP-методов
function RequestMapping(
  method: RequestMethod,
  path?: string | string[],
): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    // Сохраняем путь: '/movies/:id'
    Reflect.defineMetadata(PATH_METADATA, path ?? '/', descriptor.value);

    // Сохраняем HTTP-метод: GET, POST, PATCH...
    Reflect.defineMetadata(METHOD_METADATA, method, descriptor.value);
  };
}

// Каждый декоратор — просто обёртка с подставленным методом
export function Get(path?: string | string[]): MethodDecorator {
  return RequestMapping(RequestMethod.GET, path);
}

export function Post(path?: string | string[]): MethodDecorator {
  return RequestMapping(RequestMethod.POST, path);
}

export function Delete(path?: string | string[]): MethodDecorator {
  return RequestMapping(RequestMethod.DELETE, path);
}

// При старте NestJS сканирует все контроллеры и читает:
//   const path = Reflect.getMetadata(PATH_METADATA, method);
//   const httpMethod = Reflect.getMetadata(METHOD_METADATA, method);
//   // и регистрирует роут в Express/Fastify
```

### 4. `@Body()`, `@Param()`, `@Query()` — параметры запроса

```ts
// Реальная реализация (упрощённо)
// https://github.com/nestjs/nest/blob/master/packages/common/decorators/http/route-params.decorator.ts

import { ROUTE_ARGS_METADATA } from '../../constants';
import { RouteParamtypes } from '../../enums';

function createRouteParamDecorator(paramtype: RouteParamtypes) {
  // property — это необязательный ключ: @Body('title') → property = 'title'
  return (property?: string): ParameterDecorator => {
    return (target, propertyKey, parameterIndex) => {
      // Читаем уже существующие параметры (может быть несколько @Param, @Body...)
      const existingParams =
        Reflect.getMetadata(ROUTE_ARGS_METADATA, target, propertyKey) || {};

      // Ключ = тип:индекс, например 'BODY:0', 'PARAM:1'
      const key = `${paramtype}:${parameterIndex}`;

      // Добавляем информацию о параметре
      Reflect.defineMetadata(
        ROUTE_ARGS_METADATA,
        {
          ...existingParams,
          [key]: {
            index: parameterIndex,  // позиция в аргументах метода
            data: property,          // 'id', 'title', undefined...
          },
        },
        target,
        propertyKey,
      );
    };
  };
}

// Каждый декоратор — вызов фабрики с нужным типом
export const Body = createRouteParamDecorator(RouteParamtypes.BODY);
export const Param = createRouteParamDecorator(RouteParamtypes.PARAM);
export const Query = createRouteParamDecorator(RouteParamtypes.QUERY);
export const Headers = createRouteParamDecorator(RouteParamtypes.HEADERS);

// Пример: что сохраняется для метода findOne(@Param('id') id, @Body() dto)
// ROUTE_ARGS_METADATA → {
//   'PARAM:0': { index: 0, data: 'id' },
//   'BODY:1':  { index: 1, data: undefined }
// }
//
// При вызове NestJS читает это и делает:
//   args[0] = req.params['id']      — для PARAM:0
//   args[1] = req.body              — для BODY:1
//   method.apply(controller, args)
```

### 5. `@Controller()` — собираем всё вместе

```ts
// Реальная реализация (упрощённо)
// https://github.com/nestjs/nest/blob/master/packages/common/decorators/core/controller.decorator.ts

import { CONTROLLER_WATERMARK, PATH_METADATA, SCOPE_OPTIONS_METADATA } from '../../constants';

export function Controller(prefixOrOptions?: string | ControllerOptions): ClassDecorator {
  const prefix = typeof prefixOrOptions === 'string'
    ? prefixOrOptions
    : prefixOrOptions?.path ?? '/';

  return (target: Function) => {
    // Флаг "это контроллер"
    Reflect.defineMetadata(CONTROLLER_WATERMARK, true, target);

    // Базовый путь: 'movies'
    Reflect.defineMetadata(PATH_METADATA, prefix, target);

    // Scope (optional)
    Reflect.defineMetadata(SCOPE_OPTIONS_METADATA, prefixOrOptions, target);
  };
}
```

### Как NestJS читает всё это при старте

```
Старт приложения
       │
       ▼
Сканирует все @Module() → находит controllers и providers
       │
       ▼
Для каждого controller:
  ├─ Читает CONTROLLER_WATERMARK → да, это контроллер
  ├─ Читает PATH_METADATA → 'movies'
  ├─ Читает design:paramtypes → [MoviesService] → инжектит зависимости
  │
  └─ Для каждого метода:
       ├─ Читает METHOD_METADATA → GET
       ├─ Читает PATH_METADATA → ':id'
       ├─ Читает ROUTE_ARGS_METADATA → { 'PARAM:0': { data: 'id' } }
       │
       └─ Регистрирует в Express:
            app.get('/movies/:id', (req, res) => {
              const args = [req.params['id']];
              const result = controller.findOne(...args);
              res.json(result);
            })
```

---

## Частые ошибки / Gotchas

### 1. Забыл `@Injectable()` — DI не работает

```ts
// ❌ НЕПРАВИЛЬНО — NestJS не знает об этом классе
class MoviesService {
  constructor(private prisma: PrismaService) {} // Error: can't resolve
}

// ✅ ПРАВИЛЬНО
@Injectable()
class MoviesService {
  constructor(private prisma: PrismaService) {}
}
```

### 2. Порядок декораторов имеет значение

```ts
// ❌ Guard проверяет роли ДО того, как @Roles() установил метаданные?
// Нет, порядок декораторов не влияет на runtime-порядок Guards/Interceptors.
// Но читаемость страдает. Конвенция:

// ✅ Сначала метаданные, потом поведение
@Roles('admin')
@UseGuards(AuthGuard, RolesGuard)
@Post()
create() {}
```

### 3. `@Res()` отключает автоматическую сериализацию

```ts
// ❌ NestJS больше не управляет ответом — interceptors не сработают
@Get()
findAll(@Res() res: Response) {
  res.json(data); // ручной ответ
}

// ✅ Используй passthrough, если нужен доступ к res
@Get()
findAll(@Res({ passthrough: true }) res: Response) {
  res.header('X-Custom', 'value');
  return data; // NestJS всё ещё управляет ответом
}
```

### 4. Декоратор на arrow function не работает

```ts
class Controller {
  // ❌ Arrow functions не имеют prototype — декоратор не применится корректно
  @Get()
  findAll = async () => {};

  // ✅ Используй обычный метод
  @Get()
  async findAll() {}
}
```

### 5. Circular dependency при композиции модулей

```ts
// ❌ ModuleA импортирует ModuleB, и наоборот
@Module({ imports: [ModuleB] })
class ModuleA {}

@Module({ imports: [ModuleA] })
class ModuleB {}

// ✅ Используй forwardRef()
@Module({ imports: [forwardRef(() => ModuleB)] })
class ModuleA {}
```

### 6. Не путай legacy и TC39 декораторы

```ts
// В tsconfig.json для NestJS ОБЯЗАТЕЛЬНО:
{
  "compilerOptions": {
    "experimentalDecorators": true,    // legacy декораторы
    "emitDecoratorMetadata": true      // генерация метаданных для DI
  }
}
// Без этих флагов NestJS DI не будет работать!
```

---

## Ссылки и ресурсы

### Официальная документация
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) — справочник по legacy декораторам
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators) — создание кастомных декораторов в NestJS
- [TC39 Decorators Proposal](https://github.com/tc39/proposal-decorators) — новый стандарт (Stage 3)
- [TC39 Decorator Metadata Proposal](https://github.com/tc39/proposal-decorator-metadata) — метаданные для TC39 декораторов

### Статьи и туториалы
- [Deep Dive into NestJS Decorators (DEV.to)](https://dev.to/tejastn10/deep-dive-into-nestjs-decorators-internals-usage-and-custom-implementations-4eha)
- [Mastering Custom Decorators and Metadata in NestJS](https://shiftasia.com/community/mastering-custom-decorators-and-metadata-in-nestjs/)
- [TypeScript Reflect Metadata — What it is and How to Use it](https://blog.bitsrc.io/typescripts-reflect-metadata-what-it-is-and-how-to-use-it-fb7b19cfc7e2)
- [JavaScript Decorators: Native Support, TypeScript, and Beyond](https://www.furkanbaytekin.dev/blogs/software/javascript-decorators-native-support-typescript-and-beyond)

### Что изучить дальше
- **Dependency Injection** — как NestJS использует метаданные декораторов для автоматического создания зависимостей
- **Guards, Interceptors, Pipes** — слои NestJS, которые работают через декораторы
- **Validation (class-validator)** — декораторы для валидации DTO (`@IsString()`, `@IsInt()`, `@MinLength()`)
- **TypeORM / Prisma** — декораторы для описания схемы БД (в TypeORM)
