export const ITEM_TAG_OPTIONS = ['Архив', 'Лимит', 'Повседневная', 'Ручная работа', 'Коллаборация', 'Сезонная', 'Редкая'];
export const ITEM_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS'];
export const ITEM_COLOR_OPTIONS = ['Чёрный', 'Белый', 'Серый', 'Синий', 'Красный', 'Зелёный', 'Бежевый', 'Коричневый', 'Мульти'];
export const ARTICLE_TOPIC_OPTIONS = ['Хайп', 'Мода', 'Архив', 'Аналитика', 'Гид', 'Интервью', 'Бренд', 'Новости'];

export const csvToList = (value: string) => value.split(',').map((entry) => entry.trim()).filter(Boolean);
export const listToCsv = (values: string[]) => values.join(', ');

export const toggleCsvValue = (value: string, option: string) => {
    const list = csvToList(value);
    const next = list.includes(option)
        ? list.filter((entry) => entry !== option)
        : [...list, option];

    return listToCsv(next);
};
