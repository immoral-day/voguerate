<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

// Свои artisan-команды можно добавить здесь, например:
// Artisan::command('app:some-task', function () { ... });

Artisan::command('app:clean-demo-names {--apply : реально записать изменения в БД} {--users : также переименовать подозрительные ники пользователей}', function () {
    $apply = (bool) $this->option('apply');
    $includeUsers = (bool) $this->option('users');
    $changes = [];

    $nameMap = [
        '321312' => 'Ночной архив',
        '321312321312312312312' => 'Ночной архив',
        '100000' => 'Синяя сетка',
        '31' => 'Бордовый ворот',
        '312' => 'Кошачий трикотаж',
        'test' => 'Полевой жилет',
        'тест' => 'Полевой жилет',
        'Версачи' => 'Синий лонгслив',
        'Макссила' => 'Розовый жилет',
        'Лимфаплан' => 'Шумный свитер',
        'Образы' => 'Гобеленовый свитер',
        'артру' => 'Розовый архив',
    ];

    $brandMap = [
        '312312' => 'Voyage Archive',
        '312312312312312312312' => 'Voyage Archive',
        'ВладиславМалыгин' => 'Malygin Studio',
        'Ветмо' => 'Vetmo',
        'ZZ' => 'ZZ Archive',
        'testic123' => 'Testic Archive',
        'Гучи' => 'Gucci Archive',
        'Хаски' => 'Haski',
        'Лимфа' => 'Limfa',
        'никита' => 'Nikita Lab',
    ];

    $itemNames = [
        'Streetwear' => ['Серый худи архив', 'Широкий свитер', 'Бордовый ворот', 'Синий лонгслив', 'Гобеленовый свитер'],
        'Luxury' => ['Ночной архив', 'Полевой жилет', 'Тёмный жакет', 'Линия ателье', 'Архивная куртка'],
        'Techwear' => ['Технический слой', 'Чёрный модуль', 'Карманный жилет', 'Дождевой комплект', 'Сигнальная куртка'],
        'Vintage' => ['Архивный кардиган', 'Розовый жилет', 'Кошачий трикотаж', 'Шумный свитер', 'Старая форма'],
    ];

    $brandNames = [
        'Streetwear' => ['Voyage Supply', 'North Yard', 'Street Archive', 'Daily Uniform'],
        'Luxury' => ['Atelier Noir', 'Malygin Studio', 'Quiet Luxury', 'Line Archive'],
        'Techwear' => ['Raven Line', 'Grid Unit', 'Urban Shell', 'Rain System'],
        'Vintage' => ['Old Stock', 'Archive Room', 'Vintage Bureau', 'Second Wave'],
    ];

    $userNames = [
        'avant_garde',
        'fashion_killa',
        'minimalist_dev',
        'thrift_god',
        'hype_beast',
        'archive_reader',
        'runway_notes',
        'quiet_luxury',
        'street_curator',
        'fabric_hunter',
    ];

    $isBad = static function ($value): bool {
        $value = trim((string) $value);
        $lower = mb_strtolower($value);

        return $value === ''
            || preg_match('/^(test|тест|demo|пример|null|undefined)$/u', $lower)
            || preg_match('/^\d{2,}$/u', $value)
            || preg_match('/\d{4,}/u', $value)
            || preg_match('/^(.)\1{3,}$/u', $lower);
    };

    $pick = static function (array $pool, int $id): string {
        return $pool[($id - 1) % count($pool)];
    };

    $register = static function (string $table, int $id, string $column, $from, $to) use (&$changes): void {
        if ($to !== null && trim((string) $from) !== trim((string) $to)) {
            $changes[] = [$table, $id, $column, (string) $from, (string) $to];
        }
    };

    DB::transaction(function () use (
        $apply,
        $includeUsers,
        &$changes,
        $nameMap,
        $brandMap,
        $itemNames,
        $brandNames,
        $userNames,
        $isBad,
        $pick,
        $register
    ) {
        foreach (DB::table('clothing_items')->orderBy('id')->get() as $item) {
            $category = $item->category ?: 'Streetwear';
            $newName = $nameMap[$item->name] ?? ($isBad($item->name) ? $pick($itemNames[$category] ?? $itemNames['Streetwear'], (int) $item->id) : null);
            $newBrand = $brandMap[$item->brand] ?? ($isBad($item->brand) ? $pick($brandNames[$category] ?? $brandNames['Streetwear'], (int) $item->id) : null);

            $register('clothing_items', (int) $item->id, 'name', $item->name, $newName);
            $register('clothing_items', (int) $item->id, 'brand', $item->brand, $newBrand);

            if ($apply) {
                $data = [];
                if ($newName !== null) $data['name'] = $newName;
                if ($newBrand !== null) $data['brand'] = $newBrand;
                if ($data) DB::table('clothing_items')->where('id', $item->id)->update($data);
            }
        }

        foreach (DB::table('drops')->orderBy('id')->get() as $drop) {
            $newName = $nameMap[$drop->name] ?? ($isBad($drop->name) ? 'Анонс архива #' . $drop->id : null);
            $newBrand = $brandMap[$drop->brand] ?? ($isBad($drop->brand) ? 'Voyage Archive' : null);

            $register('drops', (int) $drop->id, 'name', $drop->name, $newName);
            $register('drops', (int) $drop->id, 'brand', $drop->brand, $newBrand);

            if ($apply) {
                $data = [];
                if ($newName !== null) $data['name'] = $newName;
                if ($newBrand !== null) $data['brand'] = $newBrand;
                if ($data) DB::table('drops')->where('id', $drop->id)->update($data);
            }
        }

        if (DB::getSchemaBuilder()->hasTable('articles')) {
            foreach (DB::table('articles')->orderBy('id')->get() as $article) {
                $newTitle = $isBad($article->title) ? 'Заметка архива #' . $article->id : null;
                $register('articles', (int) $article->id, 'title', $article->title, $newTitle);

                if ($apply && $newTitle !== null) {
                    DB::table('articles')->where('id', $article->id)->update(['title' => $newTitle]);
                }
            }
        }

        if (DB::getSchemaBuilder()->hasTable('authorship_requests')) {
            foreach (DB::table('authorship_requests')->orderBy('id')->get() as $request) {
                $newBrandName = $brandMap[$request->brand_name] ?? ($isBad($request->brand_name) ? 'Voyage Archive' : null);
                $register('authorship_requests', (int) $request->id, 'brand_name', $request->brand_name, $newBrandName);

                if ($apply && $newBrandName !== null) {
                    DB::table('authorship_requests')->where('id', $request->id)->update(['brand_name' => $newBrandName]);
                }
            }
        }

        if ($includeUsers) {
            foreach (DB::table('users')->orderBy('id')->get() as $user) {
                if (in_array($user->username, ['admin', 'Day'], true)) {
                    continue;
                }

                if (!$isBad($user->username)) {
                    continue;
                }

                $base = $pick($userNames, (int) $user->id);
                $newUsername = $base;
                $suffix = 2;

                while (
                    DB::table('users')
                        ->where('username', $newUsername)
                        ->where('id', '!=', $user->id)
                        ->exists()
                ) {
                    $newUsername = $base . '_' . $suffix;
                    $suffix++;
                }

                $register('users', (int) $user->id, 'username', $user->username, $newUsername);
                $register('users', (int) $user->id, 'name', $user->name, $newUsername);

                if ($apply) {
                    DB::table('users')->where('id', $user->id)->update([
                        'username' => $newUsername,
                        'name' => $newUsername,
                    ]);
                }
            }
        }
    });

    if (!$changes) {
        $this->info('Подозрительных названий не найдено.');
        return 0;
    }

    $this->table(['table', 'id', 'column', 'before', 'after'], $changes);

    if ($apply) {
        $this->info('Готово: изменения записаны в базу.');
    } else {
        $this->warn('Это был предпросмотр. Чтобы записать изменения, запусти: php artisan app:clean-demo-names --apply');
        $this->warn('Чтобы также переименовать плохие ники пользователей: php artisan app:clean-demo-names --apply --users');
    }

    return 0;
});

Artisan::command('app:polish-demo-content {--apply : реально записать изменения в БД}', function () {
    $apply = (bool) $this->option('apply');
    $changes = [];

    $register = static function (string $table, int $id, string $column, $from, $to) use (&$changes): void {
        if ($to !== null && trim((string) $from) !== trim((string) $to)) {
            $changes[] = [$table, $id, $column, (string) $from, (string) $to];
        }
    };

    $items = [
        ['name' => 'Бордовый ворот', 'brand' => 'ZZ Archive', 'category' => 'Streetwear', 'price' => 200, 'rating' => 81, 'tags' => ['трикотаж', 'ворот', 'архив'], 'sizes' => ['S', 'M', 'L'], 'colors' => ['бордовый', 'синий']],
        ['name' => 'Синяя сетка', 'brand' => 'Malygin Studio', 'category' => 'Streetwear', 'price' => 100000, 'rating' => 81, 'tags' => ['жаккард', 'синий', 'сетка'], 'sizes' => ['M', 'L'], 'colors' => ['синий']],
        ['name' => 'Кутюр', 'brand' => 'Vetmo', 'category' => 'Vintage', 'price' => 110000, 'rating' => 80, 'tags' => ['кардиган', 'архив', 'винтаж'], 'sizes' => ['M'], 'colors' => ['бордовый', 'молочный', 'синий']],
        ['name' => 'Полевой жилет', 'brand' => 'Line Archive', 'category' => 'Luxury', 'price' => 321312, 'rating' => 78, 'tags' => ['жилет', 'слои', 'полевой стиль'], 'sizes' => ['M', 'L'], 'colors' => ['зелёный']],
        ['name' => 'Кошачий трикотаж', 'brand' => 'Testic Archive', 'category' => 'Streetwear', 'price' => 312, 'rating' => 73, 'tags' => ['графика', 'трикотаж', 'ирония'], 'sizes' => ['S', 'M'], 'colors' => ['бежевый', 'синий']],
        ['name' => 'Синий лонгслив', 'brand' => 'Gucci Archive', 'category' => 'Streetwear', 'price' => 20099, 'rating' => 72, 'tags' => ['лонгслив', 'синий', 'база'], 'sizes' => ['S', 'M', 'L'], 'colors' => ['синий']],
        ['name' => 'Розовый жилет', 'brand' => 'Haski', 'category' => 'Streetwear', 'price' => 12220, 'rating' => 48, 'tags' => ['жилет', 'розовый', 'преппи'], 'sizes' => ['S', 'M'], 'colors' => ['розовый']],
        ['name' => 'Шумный свитер', 'brand' => 'Limfa', 'category' => 'Streetwear', 'price' => 21330, 'rating' => 48, 'tags' => ['свитер', 'принт', 'фактура'], 'sizes' => ['M', 'L'], 'colors' => ['серый', 'красный']],
        ['name' => 'Ночной архив', 'brand' => 'Voyage Supply', 'category' => 'Luxury', 'price' => 321312, 'rating' => 84, 'tags' => ['куртка', 'архив', 'ночной цвет'], 'sizes' => ['M'], 'colors' => ['зелёный', 'чёрный']],
        ['name' => 'Гобеленовый свитер', 'brand' => 'Testic Archive', 'category' => 'Vintage', 'price' => 12000, 'rating' => 74, 'tags' => ['гобелен', 'трикотаж', 'рисунок'], 'sizes' => ['M', 'L'], 'colors' => ['бежевый', 'голубой']],
        ['name' => 'Серый воротник', 'brand' => 'Savushkin', 'category' => 'Vintage', 'price' => 20000, 'rating' => 76, 'tags' => ['воротник', 'флис', 'зима'], 'sizes' => ['M', 'L'], 'colors' => ['серый']],
    ];

    $reviewTexts = [
        'Форма держится уверенно, материал плотный, но не тяжёлый. Вещь хорошо работает как самостоятельный акцент и не выглядит случайной покупкой.',
        'Силуэт спокойный и понятный: сидит аккуратно, не спорит с базой, но даёт образу характер. Для своей цены выглядит убедительно.',
        'Ткань приятная, детали собраны без лишнего шума. Есть ощущение архивной вещи, которую можно носить часто, а не держать только для фото.',
        'Главный плюс — баланс между практичностью и визуальным весом. Вживую вещь должна смотреться лучше, чем на плоской карточке.',
        'Работа с цветом удачная: оттенок не кричит, но хорошо цепляет взгляд. Минус только в том, что вещь требует аккуратного сочетания.',
        'По посадке всё достаточно честно. Это не универсальная база, зато как акцентный предмет вещь выполняет задачу без перегруза.',
    ];

    $articles = [
        [
            'title' => 'Как читать архивную вещь без лишнего шума',
            'body' => '<p>Архивная вещь ценится не только редкостью. Важны посадка, состояние, материал, история силуэта и то, насколько предмет живёт в реальном гардеробе.</p><p>ВОЯЖРЕЙТ смотрит на вещи как на часть культуры: оценка должна объяснять, почему предмет работает, а не просто фиксировать хайп.</p>',
            'image' => null,
        ],
        [
            'title' => 'Почему рейтинг не равен лайку',
            'body' => '<p>Лайк показывает реакцию сообщества, а рейтинг требует аргумента. Хорошая рецензия объясняет силу вещи через форму, материал, актуальность и личный опыт носки.</p><p>Так появляется архив мнений, который полезен не только сегодня, но и через сезон.</p>',
            'image' => null,
        ],
        [
            'title' => 'Короткий гид по ценности предмета',
            'body' => '<p>Индекс ценности складывается из оценки сообщества, количества мнений и цены. Он не заменяет вкус, но помогает быстро понять, насколько предмет устойчив в обсуждении.</p>',
            'image' => null,
        ],
    ];

    DB::transaction(function () use ($apply, &$changes, $register, $items, $reviewTexts, $articles) {
        foreach (DB::table('clothing_items')->orderBy('id')->get() as $index => $item) {
            $preset = $items[$index % count($items)];
            $data = [
                'name' => $preset['name'],
                'brand' => $preset['brand'],
                'category' => $preset['category'],
                'price' => $preset['price'],
                'type' => 'SINGLE_LOOK',
                'tags' => json_encode($preset['tags'], JSON_UNESCAPED_UNICODE),
                'sizes' => json_encode($preset['sizes'], JSON_UNESCAPED_UNICODE),
                'colors' => json_encode($preset['colors'], JSON_UNESCAPED_UNICODE),
            ];

            foreach ($data as $column => $value) {
                $register('clothing_items', (int) $item->id, $column, $item->{$column} ?? '', $value);
            }

            if ($apply) {
                DB::table('clothing_items')->where('id', $item->id)->update($data);
            }
        }

        $users = DB::table('users')->orderBy('id')->pluck('id')->all();
        $clothingIds = DB::table('clothing_items')->orderBy('id')->pluck('id')->all();

        if ($users && $clothingIds) {
            foreach ($clothingIds as $itemIndex => $itemId) {
                $existing = DB::table('reviews')->where('clothing_item_id', $itemId)->orderBy('id')->get();
                $target = max(2, $existing->count());

                for ($i = 0; $i < $target; $i++) {
                    $rating = max(45, min(90, ($items[$itemIndex % count($items)]['rating'] ?? 76) - ($i * 4)));
                    $breakdown = [
                        'concept' => max(1, min(10, (int) round($rating / 9))),
                        'execution' => max(1, min(10, (int) round(($rating - 4) / 9))),
                        'dna' => max(1, min(10, (int) round(($rating - 2) / 9))),
                        'relevance' => max(1, min(5, (int) round($rating / 18))),
                        'vibe' => max(1, min(5, (int) round(($rating - 3) / 18))),
                    ];
                    $text = $reviewTexts[($itemIndex + $i) % count($reviewTexts)];
                    $userId = $users[($itemIndex + $i) % count($users)];

                    if (isset($existing[$i])) {
                        $review = $existing[$i];
                        $register('reviews', (int) $review->id, 'text', $review->text, $text);
                        $register('reviews', (int) $review->id, 'rating', $review->rating, $rating);

                        if ($apply) {
                            DB::table('reviews')->where('id', $review->id)->update([
                                'rating' => $rating,
                                'rating_breakdown' => json_encode($breakdown, JSON_UNESCAPED_UNICODE),
                                'text' => $text,
                                'likes' => max((int) $review->likes, $i === 0 ? 1 : 0),
                            ]);
                        }
                    } elseif ($apply) {
                        DB::table('reviews')->insert([
                            'user_id' => $userId,
                            'clothing_item_id' => $itemId,
                            'rating' => $rating,
                            'rating_breakdown' => json_encode($breakdown, JSON_UNESCAPED_UNICODE),
                            'text' => $text,
                            'likes' => $i === 0 ? 1 : 0,
                            'created_at' => now()->subDays(($itemIndex * 3) + $i),
                            'updated_at' => now(),
                        ]);
                        $changes[] = ['reviews', (int) $itemId, 'insert', 'нет второй рецензии', $text];
                    } else {
                        $changes[] = ['reviews', (int) $itemId, 'insert', 'нет второй рецензии', $text];
                    }
                }
            }

            if ($apply) {
                foreach ($clothingIds as $itemId) {
                    $stats = DB::table('reviews')
                        ->where('clothing_item_id', $itemId)
                        ->selectRaw('COUNT(*) as count_reviews, AVG(rating) as avg_rating')
                        ->first();

                    DB::table('clothing_items')->where('id', $itemId)->update([
                        'rating_count' => (int) $stats->count_reviews,
                        'average_rating' => (int) round((float) $stats->avg_rating),
                    ]);
                }
            }
        }

        foreach (DB::table('drops')->orderBy('id')->get() as $index => $drop) {
            $preset = $items[($index + 2) % count($items)];
            $data = [
                'name' => $preset['name'],
                'brand' => $preset['brand'],
                'price' => (string) $preset['price'],
                'release_date' => now()->addDays(7 + ($index * 8))->format('Y-m-d H:i:s'),
            ];

            foreach ($data as $column => $value) {
                $register('drops', (int) $drop->id, $column, $drop->{$column} ?? '', $value);
            }

            if ($apply) {
                DB::table('drops')->where('id', $drop->id)->update($data);
            }
        }

        if (DB::getSchemaBuilder()->hasTable('articles')) {
            $existing = DB::table('articles')->orderBy('id')->get();
            foreach ($articles as $index => $articleData) {
                if (isset($existing[$index])) {
                    $article = $existing[$index];
                    $register('articles', (int) $article->id, 'title', $article->title, $articleData['title']);
                    $register('articles', (int) $article->id, 'body', $article->body, $articleData['body']);

                    if ($apply) {
                        DB::table('articles')->where('id', $article->id)->update([
                            'title' => $articleData['title'],
                            'body' => $articleData['body'],
                            'image' => $article->image ?: $articleData['image'],
                            'published_at' => $article->published_at ?: now(),
                            'updated_at' => now(),
                        ]);
                    }
                } elseif ($apply) {
                    DB::table('articles')->insert([
                        'title' => $articleData['title'],
                        'body' => $articleData['body'],
                        'image' => $articleData['image'],
                        'published_at' => now()->subDays($index),
                        'created_at' => now()->subDays($index),
                        'updated_at' => now(),
                    ]);
                    $changes[] = ['articles', $index + 1, 'insert', 'нет статьи', $articleData['title']];
                } else {
                    $changes[] = ['articles', $index + 1, 'insert', 'нет статьи', $articleData['title']];
                }
            }
        }
    });

    if (!$changes) {
        $this->info('Контент уже выглядит заполненным.');
        return 0;
    }

    $this->table(['table', 'id', 'column', 'before', 'after'], array_slice($changes, 0, 80));

    if (count($changes) > 80) {
        $this->line('...и ещё ' . (count($changes) - 80) . ' изменений.');
    }

    if ($apply) {
        $this->info('Готово: контентные данные обновлены. Пользователи и ники не изменялись.');
    } else {
        $this->warn('Это предпросмотр. Чтобы записать изменения, запусти: php artisan app:polish-demo-content --apply');
    }

    return 0;
});

Artisan::command('app:diagnose', function () {
    $databasePath = DB::connection()->getDatabaseName();
    $tables = ['users', 'clothing_items', 'reviews', 'drops', 'articles', 'chat_messages'];

    $this->info('Database: ' . $databasePath);
    $this->line('Database size: ' . number_format(File::exists($databasePath) ? File::size($databasePath) : 0) . ' bytes');

    foreach ($tables as $table) {
        if (DB::getSchemaBuilder()->hasTable($table)) {
            $this->line("{$table}: " . DB::table($table)->count());
        }
    }

    if (DB::getSchemaBuilder()->hasTable('users')) {
        $visibleUsers = \App\Models\User::query()->notBanned()->count();
        $this->line('Visible users: ' . $visibleUsers);
    }

    if (DB::getSchemaBuilder()->hasTable('reviews') && DB::getSchemaBuilder()->hasTable('users')) {
        $orphanReviews = DB::table('reviews as r')
            ->leftJoin('users as u', 'r.user_id', '=', 'u.id')
            ->whereNull('u.id')
            ->count();
        $this->line('Orphan reviews: ' . $orphanReviews);
    }

    if (DB::getSchemaBuilder()->hasTable('chat_messages') && DB::getSchemaBuilder()->hasTable('users')) {
        $orphanMessages = DB::table('chat_messages as m')
            ->leftJoin('users as sender', 'm.sender_id', '=', 'sender.id')
            ->leftJoin('users as recipient', 'm.recipient_id', '=', 'recipient.id')
            ->where(fn ($users) => $users
                ->whereNull('sender.id')
                ->orWhereNull('recipient.id'))
            ->count();
        $this->line('Orphan chat messages: ' . $orphanMessages);
    }

    $storagePaths = collect();
    $rememberStoragePath = function ($value) use ($storagePaths): void {
        if (!is_string($value) || trim($value) === '') {
            return;
        }

        $path = parse_url($value, PHP_URL_PATH) ?: $value;
        if (str_starts_with($path, '/storage/')) {
            $storagePaths->push(substr($path, strlen('/storage/')));
        }
    };

    if (DB::getSchemaBuilder()->hasTable('users')) {
        DB::table('users')->select(['avatar', 'profile_background'])->get()->each(
            function ($user) use ($rememberStoragePath): void {
                $rememberStoragePath($user->avatar);
                $rememberStoragePath($user->profile_background);
            }
        );
    }

    if (DB::getSchemaBuilder()->hasTable('clothing_items')) {
        DB::table('clothing_items')->select(['image', 'images'])->get()->each(
            function ($item) use ($rememberStoragePath): void {
                $rememberStoragePath($item->image);
                foreach ((array) json_decode($item->images ?: '[]', true) as $image) {
                    $rememberStoragePath($image);
                }
            }
        );
    }

    foreach (['drops', 'articles'] as $table) {
        if (DB::getSchemaBuilder()->hasTable($table)) {
            DB::table($table)->pluck('image')->each($rememberStoragePath);
        }
    }

    $storagePaths = $storagePaths->unique()->values();
    $missingStoragePaths = $storagePaths->filter(
        fn (string $path) => !File::exists(storage_path('app/public/' . $path))
    )->values();
    $this->line('Referenced storage files: ' . $storagePaths->count());
    $this->line('Missing storage files: ' . $missingStoragePaths->count());

    foreach ($missingStoragePaths->take(20) as $path) {
        $this->warn('  missing: ' . $path);
    }

    $this->line('Cache store: ' . config('cache.default'));
    $this->line('Session driver: ' . config('session.driver'));

    $journalMode = DB::selectOne('PRAGMA journal_mode');
    $pageCount = DB::selectOne('PRAGMA page_count');
    $freePages = DB::selectOne('PRAGMA freelist_count');

    $this->line('Journal mode: ' . ($journalMode->journal_mode ?? 'unknown'));
    $this->line('Pages: ' . ($pageCount->page_count ?? 0));
    $this->line('Free pages: ' . ($freePages->freelist_count ?? 0));
})->purpose('Show production database size and row counts');

Artisan::command('app:database-maintain {--vacuum : Rebuild the SQLite database file}', function () {
    DB::statement('PRAGMA optimize');
    DB::statement('PRAGMA wal_checkpoint(TRUNCATE)');
    $this->info('SQLite optimize and WAL checkpoint completed.');

    if ($this->option('vacuum')) {
        DB::statement('VACUUM');
        $this->info('SQLite VACUUM completed.');
    }
})->purpose('Optimize SQLite and truncate its WAL file');
