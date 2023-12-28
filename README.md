#  STRAPI 1C EXCHANGE PLUGIN
#  Name: MegaExchange
#  Version: 0.0.0.3;
## Author: Roman Agafonov / Роман Агафонов
## LICENSE: Apache 2.0

Это моя первая попытка  open-source "серьезного" проекта. По этому зная
Свое любимое токсичное комьюнити, прошу отнестись с пониманием.
Здравомыслящая критика и предложения по улучшению приветствуются.

Если у Вас возникло желание поддержать мое начинание, то я с удовольствием приму
любое пожертвование на карту :)

### 2200700818815853
Роман А. Тинькофф

### Идея проекта
Состоит в создании универсального плагина для обмена данными с 1С Предприятием и ему подобным релятивным шлаком,
по протоколу CommerceML 2 / CommerceML EDI

### Что планируется:

- авторизация
- UI интерфейс на основе bootstrap stapi
- автогенерация типов данных и их комплементация в единую абстракцию
- проверка изменений
- авторегенерация изображений

> Это динамический список.

### Что Сделано:
##### На стороне php
- Простейшая авторизация. На стороне PHP!
- Обработка файла приходящего от 1С и сохранение на бэке
- Послание сигнала, на роут плагина в strapi о том, что файл получен.

##### На стороне strapi
- Поиск, распаковка и получение папки с XMLками от 1C
> Это динамический список.

### В процессе:
- Преобразование XML в JSON формат.
- Создание content-type 

## HOT NEWS

#### UPDATE 28.12.2023
Беда оказалась в том, что 1С передает данные на сайт по дефолту через php,
а именно php://input
Сколько не пытался распарсить входные данные из под STRApi ничего не вышло.
Пришлость написать доп. обертку в виде php мидлваря, который сохраняет файлы 
приходящие от 1С в публичную папку бэка.
Пока так, потом буду думать :)

## INSTALATION / УСТАНОВКА
### STEP 0
```
move all files in you strapi project - ..../'you_strapi_folder'/src/plugins/'you_plugin_folder' 
or
just use git clone
```
### STEP 1
```
run command into plugin folder 
------------------------------
yarn install
```
### STEP 2
```
to be continued 
```
