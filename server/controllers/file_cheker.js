'use strict';
const unzipper = require('unzipper');
const fs = require('fs')
const xmlParser = require('xml2json');

const ABS_PATH = "/usr/share/nginx/html/back/public/uploads/exchangeStrapi/tempXMLS/"

module.exports = {

  /**
   * @description Функция проверяет полученный файл.
   * @param {Context} ctx - Контекст запроса
   * @returns {Promise<void>}
   */
  async checknew(ctx) {

    const {type, mode, sessid, filename} = await ctx.request.query;

    if(filename) {
      console.log("Новые данные от 1С...Поиск...")
      console.log(filename)

      const searchZipResult = await searchInFolder(ctx, ABS_PATH, filename.split('.')[0], 'zip')
      console.log(`Результат поиска полученного от 1С архива:  ${(searchZipResult) ? "НАЙДЕН" : "НЕ НАЙДЕН"}`);

      if(await searchZipResult) {

        const resultUnzip = await unzip(ABS_PATH + filename, ABS_PATH, filename)
        console.log("Результат распаковки полученного от 1С архива: " + resultUnzip)

        if(await resultUnzip) {

          const searchFolderResult = await searchInFolder(ctx, ABS_PATH, filename.split('.')[0], false, false)
          console.log(`Результат поиска папки  с файлами:  ${(await searchFolderResult) ? "НАЙДЕН" : "НЕ НАЙДЕН"}`);

          if(await searchFolderResult) {
            const searchImportXMLs = await getAllFiles(ABS_PATH, filename.split('.')[0])
            console.log(`Ообнаружено товаров: ${await searchImportXMLs.length}`);
          }
        }
      }

        }
    }

  }


/**
 *
 * @param {String} filepath - Путь до файла
 * @param {String} fileName - Имя файла
 * @param {String} abspath - Абсолютный путь до папки
 * @returns {boolean}
 */
async function unzip(filePath = "",absPath = "/", fileName = "text.zip") {

  if(!filePath || typeof filePath !== "string") return

    //console.log("старт распаковки....")
    const newFolderName = fileName.split('.')[0];
    //console.log("Файл будет разархивирован по пути: " + newFolderName)

    const promise = new Promise((resolve, reject) => {
      try {
       const readStream = fs.createReadStream(filePath)
             readStream.pipe(unzipper.Extract({path: absPath + newFolderName}))
             readStream.on("close", () => {
              console.log("Архив распакован. Приступаем к парсингу данных");
              resolve(true)
             });
      } catch (e) {
        console.log("!!!ОШИБКА РАСПАКОВКИ АРХИВА 1С!!! controllers: file_cheker.js func: unzip");
        reject(false);
      } finally {
        //
      }
    })

  return await promise;

}

/**
 *
 * @param {Context} ctx
 * @param {String} filePath - Путь до файла
 * @param {String} fileName - Имя файла
 * @param {String} extension - Расширение файла ( по дефолту будет искать папки )
 * @returns {boolean}
 */
async function searchInFolder(ctx, filePath = "", fileName = "text", extension = "",getAllNames = false) {
  if(!filePath || typeof filePath !== "string") return

  const searchPath = (extension) ? filePath : filePath + fileName;
  console.log(getAllNames)
  try{
    if(!extension) {
     // console.log(`Поиск папки !  ${searchPath}`)
      if(fs.existsSync(searchPath)) {
        //console.log(`Папка по пути ${searchPath} cуществует`)
        ctx.body = JSON.stringify({
          error: false,
          result: true,
          data: "success"
        })
        return true
      } else {
        console.log(`Такой папки по пути - ${searchPath} не существует! ${fs.existsSync(searchPath)}`);
        return false;
      }
    } else {


      if(!getAllNames) {
        console.log("Получение одиночного файла")

        //console.log(`Поиск файла в  ${searchPath}`)
        const promise = new Promise((resolve, reject) => {
          fs.readdirSync(searchPath).map(checkName => {
            const formatSearchString = (extension) ? "." + extension : extension
            const checkString = fileName + formatSearchString
            if(checkName === checkString) {
              console.log(`
                  "Файл" с именем ${fileName} найден!
                     `)
              resolve(true);
            }
          })
        });
        return await promise
      } else {

      }

    }
  } catch(e) {
    console.log(e)
    return false;
  }

}
async function getAllFiles(absPath = "/", folderName = "test") {
  const searchPath = absPath + folderName;

  const promise = new Promise(async (resolve, reject) => {
    console.log("Получение всех файлов в папке.")
    const allFileNames = []

    fs.readdirSync(searchPath).map(async checkName => {

      const checkString = folderName
      const checkFolder = (typeof checkName.split('.')[1] != "undefined") ? true : false;

      if(checkFolder) {
        allFileNames.push({
          name: checkName,
          dir: searchPath,
          path: `${searchPath}/${checkName}`,
          jsonData: await parseXML(`${searchPath}/${checkName}`)
        })
      } else {
        console.log(`Среди файлов обнаружена папка: ${checkName}`)
      }
    })
    resolve(allFileNames)
  });

  return await promise
}


async function parseXML(path = "/") {
  let result;

  console.log(`Путь до файла с xml: ${path}`)

  const file = fs.readFileSync(path, (file) => file)

  result = JSON.parse(xmlParser.toJson(file.toString('utf-8')));

  const testObjectProduct = {
    name: ''
  }
  ////ТУТ НАЧиНАЕТСЯ РАСПАРС JSONа с ТОВАРАМИ. #КАТАЛОГ

  const productsList = result['КоммерческаяИнформация']['Каталог']['Товары']['Товар'];

  ////Проверяем категории и создаем новые если не найдено совпадений

  await createCatalog(productsList)

  ////Проверяем товары и создаем новые если не найдено совпадений

  //Создаем категории;




  //console.log(result['КоммерческаяИнформация']['Каталог']['Товары']['Товар'][0]['БазоваяЕдиница']['Пересчет'])
  //console.log(testObjectProduct)
  return await result;
}

const createCatalog = async (data = [{}]) => {

  if(!Array.isArray(data)) return false;

  for (const item of data) {

    const index = data.indexOf(item);

    if (item['ЗначенияРеквизитов']) {
      try {

        const entries = await strapi.entityService.findMany('api::category.category', {
          fields: ['name'],
          filters: {name: item['ЗначенияРеквизитов']['ЗначениеРеквизита'][1]['Значение']},
        })

        if (await entries.length == false) {

          console.log("Категории нет. Создание категории.")

          if (item['ЗначенияРеквизитов']) {

            const creatorCategories = await strapi.entityService.create('api::category.category', {
              data: {
                name: item['ЗначенияРеквизитов']['ЗначениеРеквизита'][1]['Значение'],
              },
            });

            console.log(`Категория создана: ${item['ЗначенияРеквизитов']['ЗначениеРеквизита'][1]['Значение']}`)
            console.log(await creatorCategories)

            console.log("Категория создана. Попытка создания товара в категории...")
            await createProduct(item, creatorCategories)

          }

        } else {

          console.log(`Категория с именем ${item['ЗначенияРеквизитов']['ЗначениеРеквизита'][1]['Значение']} существует. Попытка создания товара...`)
          await createProduct(item,entries[0])
        }


      } catch (e) {
        console.log(e)
        console.log(item)
        console.log("Ошибка в создании каталога!")
        continue;
      }

    }
  }
}

const createProduct = async (data = { }, category = {}) => {

    if(!data) return false;

    try {

      const entries = await strapi.entityService.findMany('api::product.product', {
        fields: ['title'],
        filters: { title: data['Наименование'] },
      })
      console.log(data['Ид'])
      console.log(entries)
      console.log(data['ЗначенияРеквизитов'])

      if(await entries.length == false) {

        if(data['Ид']) {

          /* Создание нового товара через внутреннее api */
          const creatorProduct= await strapi.entityService.create('api::product.product', {
            data: {
              title:( data['Наименование']) ?  data['Наименование'] : "Нет наименования",
              //description:( data['Описание']) ?  data['Описание'] : "Нет описания",
              id1c: ( data['Ид']) ? data['Ид'] : null,
              //stock: ( data['Количество']) ?  data['Количество'] : "Уточнять",
              //storeplace: ( data['Город']) ?  data['Город'] : "Склад неизвестен",
              //quantitySales: 0,
              //price:  ( data['Цена']) ?  data['Цена'] : 0,
              categories: {
                connect: [category.id]
              }
              //priceOpt:  ( data['ЦенаОпт']) ?  data['ЦенаОпт'] : 0,
            },
            populate: ['categories']
          });
          console.log("Товар создан")
          console.log(await creatorProduct)
        }

      } else {

        /* Обновление существующего товара через внутреннее api */
        console.log("Найден похожий товар.")
        if(!entries[0].id1c) {

          //ПОТОМ УДАЛИТЬ (!!!!!!!!!!!!!!!) ОЧИСТКА ТОВАРОВ!!!!!
          await clearProduct(entries[0].id)
          return

          console.log("У товара нет привязанного 1cID")

          if(data['Наименование']) {
            const updateEntry = await strapi.entityService.update('api::product.product', entries[0].id, {
              data: {
                id1c: data['Ид'],
                categories: {
                  connect: [category.id]
                }
              },
            });
          }

          /* Пишем тут что надо делать в случае найденного совпадения в каталоге*/

        } else {
          console.log("Товар связан с базой 1С по 1cID: Обновление")

          /* Пишем тут что надо делать в случае найденного совпадения в каталоге*/
        }

      }


    } catch(e) {
      console.log(e)
      console.log("Ошибка в создании товара!")
    }
}
/*
  const categoryEntry = await strapi.entityService.create('api::category.category', {
    data: {
      title: 'My Article',
    },
  });
 */

const clearProduct = async (id) => {
  const deleteEntry = await strapi.entityService.delete('api::product.product', id);
}
