const animationEngine = (() => {
  let uniqueID = 0;

  class AnimationEngine {
    constructor() {
      this.ids = []; // Создание массива ids
      this.animations = {}; // Создание объекта animations
      this.update = this.update.bind(this); // Привязывание метода update к текущему экземпляру класса
      this.raf = 0; // Создание переменной raf и присвоение ей начального значения 0
      this.time = 0; // Создание переменной time и присвоение ей начального значения 0
    }

    update() {
      const now = performance.now(); // Получение текущего времени
      const delta = now - this.time; // Рассчет времени, прошедшего между кадрами анимации
      this.time = now; // Обновление времени

      let i = this.ids.length; // Получение количества анимаций, которые нужно обновить

      this.raf = i ? requestAnimationFrame(this.update) : 0; // Если есть анимации для обновления, то рекурсивно вызываем метод update

      // Обновление каждой анимации
      while (i--)
        this.animations[this.ids[i]] &&
          this.animations[this.ids[i]].update(delta);
    }

    add(animation) {
      animation.id = uniqueID++; // Генерируем уникальный идентификатор для анимации

      this.ids.push(animation.id); // Добавляем идентификатор в список
      this.animations[animation.id] = animation; // Добавляем анимацию в объект

      if (this.raf !== 0) return; // Если уже была запущена анимация, то выходим

      this.time = performance.now(); // Устанавливаем текущее время для анимации
      this.raf = requestAnimationFrame(this.update); // Запускаем анимацию
    }

    remove(animation) {
      const index = this.ids.indexOf(animation.id); // Находим индекс анимации в списке

      if (index < 0) return; // Если анимация не найдена, то выходим

      this.ids.splice(index, 1); // Удаляем идентификатор из списка
      delete this.animations[animation.id]; // Удаляем анимацию из объекта
      animation = null; // Удаляем ссылку на анимацию
    }
  }

  return new AnimationEngine();
})();

class Animation {
  // Объявление класса Animation

  constructor(start) {
    // Конструктор класса

    if (start === true) this.start(); // Проверяем, передан ли в конструктор аргумент start со значением true. Если да, то вызываем метод start() у созданного экземпляра класса.
  }

  start() {
    // Метод start() добавляет текущий экземпляр класса в очередь анимаций, используя объект animationEngine.

    animationEngine.add(this);
  }

  stop() {
    // Метод stop() удаляет текущий экземпляр класса из очереди анимаций, используя объект animationEngine.

    animationEngine.remove(this);
  }

  update(delta) {} // Метод update(delta) вызывается каждый кадр и используется для обновления анимации. По умолчанию метод не делает ничего, он должен быть переопределен в классах-наследниках.
}

class World extends Animation {
  // Определение класса World, наследующего методы и свойства из класса Animation

  constructor(game) {
    // Определение конструктора для класса World, который принимает объект game

    super(true); // Вызов конструктора родительского класса Animation

    this.game = game; // Сохранение объекта game в свойстве game экземпляра класса World

    this.container = this.game.dom.game; // Сохранение контейнера для отрисовки игры
    this.scene = new THREE.Scene(); // Создание сцены для отрисовки игровых объектов

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Создание рендерера для отрисовки 3D-объектов в WebGL
    this.renderer.setPixelRatio(window.devicePixelRatio); // Задание разрешения рендерера
    this.container.appendChild(this.renderer.domElement); // Добавление рендерера на страницу в контейнер для отрисовки игры

    this.camera = new THREE.PerspectiveCamera(2, 1, 0.1, 10000); // Создание камеры для отображения 3D-объектов на сцене

    this.stage = { width: 2, height: 3 }; // Задание ширины и высоты сцены
    this.fov = 10; // Задание угла обзора камеры

    this.createLights(); // Вызов метода createLights для создания света на сцене

    this.onResize = []; // Создание массива для обработчиков событий при изменении размера окна

    this.resize(); // Вызов метода resize для первоначальной настройки размера сцены и камеры
    window.addEventListener("resize", () => this.resize(), false); // Добавление обработчика события изменения размера окна
  }

  update() {
    // Определение метода update для класса World

    this.renderer.render(this.scene, this.camera); // Вызов метода render для отрисовки сцены и камеры
  }

  // Функция, которая выполняется при изменении размеров окна
  resize() {
    // Получаем ширину и высоту контейнера
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    // Устанавливаем размеры рендерера
    this.renderer.setSize(this.width, this.height);

    this.camera.fov = this.fov; // Устанавливаем угол обзора камеры
    this.camera.aspect = this.width / this.height; // Устанавливаем соотношение сторон камеры

    // Вычисляем соотношение сторон сцены и угол обзора камеры
    const aspect = this.stage.width / this.stage.height;
    const fovRad = this.fov * THREE.Math.DEG2RAD;

    // Вычисляем расстояние до сцены
    let distance =
      aspect < this.camera.aspect
        ? this.stage.height / 2 / Math.tan(fovRad / 2)
        : this.stage.width / this.camera.aspect / (2 * Math.tan(fovRad / 2));

    distance *= 0.5;

    // Устанавливаем позицию камеры и ее направление
    this.camera.position.set(distance, distance, distance);
    this.camera.lookAt(this.scene.position);
    this.camera.updateProjectionMatrix();

    // Устанавливаем размер шрифта для корневого элемента документа
    const docFontSize =
      aspect < this.camera.aspect
        ? (this.height / 100) * aspect
        : this.width / 100;

    document.documentElement.style.fontSize = docFontSize + "px";

    // Вызываем коллбэки, связанные с изменением размеров
    if (this.onResize) this.onResize.forEach((cb) => cb());
  }

  // Создание функции createLights() для создания света в сцене
  createLights() {
    // Объявление объекта this.lights, который будет содержать свет в сцене
    this.lights = {
      holder: new THREE.Object3D(), // Создание объекта-контейнера для всех источников света
      ambient: new THREE.AmbientLight(0xffffff, 0.69), // Добавление рассеянного света
      front: new THREE.DirectionalLight(0xffffff, 0.36), // Добавление направленного света (front)
      back: new THREE.DirectionalLight(0xffffff, 0.19), // Добавление направленного света (back)
    };

    // Установка позиций источников света
    this.lights.front.position.set(1.5, 5, 3);
    this.lights.back.position.set(-1.5, -5, -3);

    // Добавление источников света в объект-контейнер this.lights.holder
    this.lights.holder.add(this.lights.ambient);
    this.lights.holder.add(this.lights.front);
    this.lights.holder.add(this.lights.back);

    this.scene.add(this.lights.holder); // Добавление объекта-контейнера в сцену
  }
}

function RoundedBoxGeometry(size, radius, radiusSegments) {
  // создаем функцию RoundedBoxGeometry с параметрами size, radius, radiusSegments

  THREE.BufferGeometry.call(this); // вызываем метод BufferGeometry у THREE и передаем ему контекст вызова

  this.type = "RoundedBoxGeometry"; // присваиваем свойству type объекта this значение 'RoundedBoxGeometry'

  radiusSegments = !isNaN(radiusSegments)
    ? Math.max(1, Math.floor(radiusSegments))
    : 1; // проверяем, является ли значение radiusSegments нечислом, и если да, то устанавливаем равным 1. Иначе, округляем его до ближайшего целого числа, которое больше либо равно 1.

  var width, height, depth; // объявляем переменные width, height, depth

  width = height = depth = size; // устанавливаем значения переменных width, height, depth равными значению переменной size
  radius = size * radius; // устанавливаем значение переменной radius как произведение size на radius

  radius = Math.min(
    radius,
    Math.min(width, Math.min(height, Math.min(depth))) / 2
  ); // устанавливаем значение переменной radius как наименьшее из radius и наименьшего из значений width, height, depth, разделенных на 2.

  var edgeHalfWidth = width / 2 - radius; // устанавливаем значение переменной edgeHalfWidth как разность значения переменной width, деленного на 2, и значения переменной radius
  var edgeHalfHeight = height / 2 - radius; // устанавливаем значение переменной edgeHalfHeight как разность значения переменной height, деленного на 2, и значения переменной radius
  var edgeHalfDepth = depth / 2 - radius; // устанавливаем значение переменной edgeHalfDepth как разность значения переменной depth, деленного на 2, и значения переменной radius

  this.parameters = {
    // создаем объект parameters внутри объекта this
    width: width, // устанавливаем свойство width объекта parameters равным значению переменной width
    height: height, // устанавливаем свойство height объекта parameters равным значению переменной height
    depth: depth, // устанавливаем свойство depth объекта parameters равным значению переменной depth
    radius: radius, // устанавливаем свойство radius объекта parameters равным значению переменной radius
    radiusSegments: radiusSegments, // устанавливаем свойство radiusSegments объекта parameters равным значению переменной radiusSegments
  };

  var rs1 = radiusSegments + 1; // Объявление переменной rs1, в которой вычисляется количество сегментов, увеличенное на 1
  var totalVertexCount = (rs1 * radiusSegments + 1) << 3; // Объявление переменной totalVertexCount, в которой вычисляется общее количество вершин в геометрии закругленного куба

  // Объявление переменных positions и normals, которые будут использоваться для хранения позиций вершин и нормалей геометрии закругленного куба
  var positions = new THREE.BufferAttribute(
    new Float32Array(totalVertexCount * 3),
    3
  );
  var normals = new THREE.BufferAttribute(
    new Float32Array(totalVertexCount * 3),
    3
  );

  // Объявление переменных, которые будут использоваться для хранения вершин, нормалей и индексов геометрии закругленного куба
  var cornerVerts = [], // вершины углов
    cornerNormals = [], // нормали углов
    normal = new THREE.Vector3(), // вектор нормали
    vertex = new THREE.Vector3(), // вектор вершины
    vertexPool = [], // буфер для хранения вершин
    normalPool = [], // буфер для хранения нормалей
    indices = []; // индексы вершин
  // Объявление переменных lastVertex и cornerVertNumber, которые будут использоваться
  // в циклах генерации вершин, нормалей и индексов геометрии закругленного куба
  var lastVertex = rs1 * radiusSegments, // последняя вершина
    cornerVertNumber = rs1 * radiusSegments + 1; // количество вершин в углах
  // Вызов функций генерации вершин, граней и ребер геометрии закругленного куба
  doVertices(); // генерация вершин
  doFaces(); // генерация граней
  doCorners(); // генерация угловых вершин
  doHeightEdges(); // генерация вершин, соединяющих верхнюю и нижнюю грани
  doWidthEdges(); // генерация вершин, соединяющих левую и правую грани
  doDepthEdges(); // генерация вершин, соединяющих переднюю и заднюю грани

  function doVertices() {
    // Функция для создания вершин и нормалей углов куба

    // Массив вершин углов куба
    var cornerLayout = [
      new THREE.Vector3(1, 1, 1), // верхний правый передний угол
      new THREE.Vector3(1, 1, -1), // верхний правый задний угол
      new THREE.Vector3(-1, 1, -1), // верхний левый задний угол
      new THREE.Vector3(-1, 1, 1), // верхний левый передний угол
      new THREE.Vector3(1, -1, 1), // нижний правый передний угол
      new THREE.Vector3(1, -1, -1), // нижний правый задний угол
      new THREE.Vector3(-1, -1, -1), // нижний левый задний угол
      new THREE.Vector3(-1, -1, 1), // нижний левый передний угол
    ];

    // Для каждого угла создаются массивы вершин и нормалей
    for (var j = 0; j < 8; j++) {
      cornerVerts.push([]);
      cornerNormals.push([]);
    }

    var PIhalf = Math.PI / 2; // Переменная для хранения половины угла Пи
    var cornerOffset = new THREE.Vector3(
      edgeHalfWidth,
      edgeHalfHeight,
      edgeHalfDepth
    ); // Вектор для хранения смещения угловой вершины куба

    // Начало цикла, перебирающего значения переменной y от 0 до radiusSegments включительно
    for (var y = 0; y <= radiusSegments; y++) {
      var v = y / radiusSegments; // Нахождение коэффициента v, равного отношению текущего значения y к значению radiusSegments
      var va = v * PIhalf; // Нахождение угла va, равного v, умноженному на PI/2 (90 градусов)
      // Нахождение косинуса и синуса угла va
      var cosVa = Math.cos(va);
      var sinVa = Math.sin(va);

      // Если y равно radiusSegments, то создается вершина на вершине фигуры, добавляется в массив вершин и массив нормалей
      if (y == radiusSegments) {
        vertex.set(0, 1, 0); //Установить координаты вектора vertex на (0, 1, 0);
        var vert = vertex.clone().multiplyScalar(radius).add(cornerOffset); //Создать копию вектора vertex, умножить ее на значение переменной "radius", добавить к ней смещение cornerOffset и сохранить в переменную vert;
        cornerVerts[0].push(vert); //Добавить вершину vert в массив cornerVerts[0];
        vertexPool.push(vert); //Добавить вершину vert в массив vertexPool;
        var norm = vertex.clone(); //Создать копию вектора vertex и сохранить в переменную norm;
        cornerNormals[0].push(norm); //Добавить вектор norm в массив cornerNormals[0];
        normalPool.push(norm); //Добавить вектор norm в массив normalPool;
        continue; //Продолжить выполнение цикла со следующей итерации.
      }

      // Вложенный цикл, перебирающий значения переменной x от 0 до radiusSegments включительно
      for (var x = 0; x <= radiusSegments; x++) {
        var u = x / radiusSegments; // Нахождение коэффициента u, равного отношению текущего значения x к значению radiusSegments
        var ha = u * PIhalf; // Нахождение угла ha, равного u, умноженному на PI/2 (90 градусов)
        // Нахождение координат вершины на основе углов va, ha и радиуса
        vertex.x = cosVa * Math.cos(ha);
        vertex.y = sinVa;
        vertex.z = cosVa * Math.sin(ha);

        // Создание вершины, добавление ее в массив вершин и массив нормалей
        var vert = vertex.clone().multiplyScalar(radius).add(cornerOffset);
        cornerVerts[0].push(vert); // Добавляем вершину в массив угловых вершин под индексом 0
        vertexPool.push(vert); // Добавляем вершину в общий пул вершин

        var norm = vertex.clone().normalize(); // Клонируем вектор и нормализуем его, затем сохраняем в переменную norm
        cornerNormals[0].push(norm); // Добавляем нормаль в массив угловых нормалей под индексом 0
        normalPool.push(norm); // Добавляем нормаль в общий пул нормалей
      }
    }

    for (var i = 1; i < 8; i++) {
      //Начинается цикл по переменной i, начальное значение которой равно 1, конечное - 8 (не включительно), шаг - 1.

      for (var j = 0; j < cornerVerts[0].length; j++) {
        //Начинается цикл по переменной j, начальное значение которой равно 0, конечное - длине массива cornerVerts[0], шаг - 1

        var vert = cornerVerts[0][j].clone().multiply(cornerLayout[i]); //Создается новая переменная vert, которая является клоном элемента массива cornerVerts[0][j], умноженным на элемент массива cornerLayout[i]
        cornerVerts[i].push(vert); //Значение vert добавляется в конец массива cornerVerts[i]
        vertexPool.push(vert); //Значение vert добавляется в конец массива vertexPool

        var norm = cornerNormals[0][j].clone().multiply(cornerLayout[i]); //Создается новая переменная norm, которая является клоном элемента массива cornerNormals[0][j], умноженным на элемент массива cornerLayout[i]
        cornerNormals[i].push(norm); //Значение norm добавляется в конец массива cornerNormals[i]
        normalPool.push(norm); //Значение norm добавляется в конец массива normalPool
      }
    }
  }

  // Функция для создания углов модели закругленного прямоугольного параллелепипеда
  function doCorners() {
    // Массив, определяющий, нужно ли перевернуть грани углов
    var flips = [true, false, true, false, false, true, false, true];

    // Смещение последнего ряда вершин
    var lastRowOffset = rs1 * (radiusSegments - 1);

    // Проходимся по всем восьми углам модели
    for (var i = 0; i < 8; i++) {
      // Определяем смещение угла в массиве вершин
      var cornerOffset = cornerVertNumber * i;

      // Проходимся по всем рядам вершин, кроме последнего
      for (var v = 0; v < radiusSegments - 1; v++) {
        // Определяем индексы вершин, образующих грани угла
        var r1 = v * rs1;
        var r2 = (v + 1) * rs1;

        // Проходимся по всем вершинам в ряду
        for (var u = 0; u < radiusSegments; u++) {
          // Определяем индексы текущей вершины и ее соседей
          var u1 = u + 1;
          var a = cornerOffset + r1 + u;
          var b = cornerOffset + r1 + u1;
          var c = cornerOffset + r2 + u;
          var d = cornerOffset + r2 + u1;

          // Добавляем индексы вершин в массив индексов, определяющих грани угла, учитывая возможность перевернуть грани
          if (!flips[i]) {
            indices.push(a);
            indices.push(b);
            indices.push(c);

            indices.push(b);
            indices.push(d);
            indices.push(c);
          } else {
            indices.push(a);
            indices.push(c);
            indices.push(b);

            indices.push(b);
            indices.push(c);
            indices.push(d);
          }
        }
      }

      // Проходимся в цикле по вершинам предыдущей грани (u-координата)
      for (var u = 0; u < radiusSegments; u++) {
        // Вычисляем индексы трех вершин треугольника (a, b, c) на предыдущей грани
        var a = cornerOffset + lastRowOffset + u;
        var b = cornerOffset + lastRowOffset + u + 1;
        var c = cornerOffset + lastVertex;

        // Проверяем, нужно ли развернуть порядок вершин в треугольнике в зависимости от значения flips[i]
        if (!flips[i]) {
          indices.push(a);
          indices.push(b);
          indices.push(c);
        } else {
          indices.push(a);
          indices.push(c);
          indices.push(b);
        }
      }
    }
  }

  function doFaces() {
    // Начало первого набора вершин для построения треугольников
    var a = lastVertex; // последняя вершина из предыдущей грани
    var b = lastVertex + cornerVertNumber; // первая вершина из текущей грани
    var c = lastVertex + cornerVertNumber * 2; // вторая вершина из текущей грани
    var d = lastVertex + cornerVertNumber * 3; // третья вершина из текущей грани

    // Добавляем вершины в правильном порядке для первого треугольника
    indices.push(a);
    indices.push(b);
    indices.push(c);
    // Добавляем вершины в правильном порядке для второго треугольника
    indices.push(a);
    indices.push(c);
    indices.push(d);

    // Начало второго набора вершин для построения треугольников
    a = lastVertex + cornerVertNumber * 4;
    b = lastVertex + cornerVertNumber * 5;
    c = lastVertex + cornerVertNumber * 6;
    d = lastVertex + cornerVertNumber * 7;

    // Добавляем вершины в правильном порядке для первого треугольника
    indices.push(a);
    indices.push(c);
    indices.push(b);
    // Добавляем вершины в правильном порядке для второго треугольника
    indices.push(a);
    indices.push(d);
    indices.push(c);

    // Начало третьего набора вершин для построения треугольников
    a = 0;
    b = cornerVertNumber;
    c = cornerVertNumber * 4;
    d = cornerVertNumber * 5;

    // Добавляем вершины в правильном порядке для первого треугольника
    indices.push(a);
    indices.push(c);
    indices.push(b);
    // Добавляем вершины в правильном порядке для второго треугольника
    indices.push(b);
    indices.push(c);
    indices.push(d);

    // Начало четвертого набора вершин для построения треугольников
    a = cornerVertNumber * 2;
    b = cornerVertNumber * 3;
    c = cornerVertNumber * 6;
    d = cornerVertNumber * 7;

    // Добавляем вершины в правильном порядке для первого треугольника
    indices.push(a);
    indices.push(c);
    indices.push(b);
    // Добавляем вершины в правильном порядке для второго треугольника
    indices.push(b);
    indices.push(c);
    indices.push(d);

    // Начало пятого набора вершин для построения треугольников
    a = radiusSegments;
    b = radiusSegments + cornerVertNumber * 3;
    c = radiusSegments + cornerVertNumber * 4;
    d = radiusSegments + cornerVertNumber * 7;

    // Добавляем вершины в правильном порядке для первого треугольника
    indices.push(a);
    indices.push(b);
    indices.push(c);
    // Добавляем вершины в правильном порядке для второго треугольника
    indices.push(b);
    indices.push(d);
    indices.push(c);

    // Начало шестого набора вершин для построения треугольников
    a = radiusSegments + cornerVertNumber;
    b = radiusSegments + cornerVertNumber * 2;
    c = radiusSegments + cornerVertNumber * 5;
    d = radiusSegments + cornerVertNumber * 6;

    // Добавляем вершины в правильном порядке для первого треугольника
    indices.push(a);
    indices.push(c);
    indices.push(b);
    // Добавляем вершины в правильном порядке для второго треугольника
    indices.push(b);
    indices.push(c);
    indices.push(d);
  }

  // Определяем функцию doHeightEdges
  function doHeightEdges() {
    // Создаем цикл по переменной i, которая пробегает значения от 0 до 3
    for (var i = 0; i < 4; i++) {
      var cOffset = i * cornerVertNumber; // Определяем переменную cOffset как i умноженное на cornerVertNumber
      var cRowOffset = 4 * cornerVertNumber + cOffset; // Определяем переменную cRowOffset как 4 умноженное на cornerVertNumber и добавленное к cOffset
      var needsFlip = i & (1 === 1); // Определяем needsFlip как true, если i является нечетным числом

      // Создаем цикл по переменной u, которая пробегает значения от 0 до radiusSegments - 1
      for (var u = 0; u < radiusSegments; u++) {
        var u1 = u + 1; // Определяем переменную u1 как u + 1
        var a = cOffset + u; // Определяем переменную a как cOffset + u
        var b = cOffset + u1; // Определяем переменную b как cOffset + u1
        var c = cRowOffset + u; // Определяем переменную c как cRowOffset + u
        var d = cRowOffset + u1; // Определяем переменную d как cRowOffset + u1

        // Проверяем, нужно ли перевернуть порядок точек, и добавляем соответствующие индексы в массив indices
        if (!needsFlip) {
          indices.push(a);
          indices.push(b);
          indices.push(c);
          indices.push(b);
          indices.push(d);
          indices.push(c);
        } else {
          indices.push(a);
          indices.push(c);
          indices.push(b);
          indices.push(b);
          indices.push(c);
          indices.push(d);
        }
      }
    }
  }

  // Определение функции с названием "doDepthEdges"
  function doDepthEdges() {
    // Создание массивов cStarts и cEnds
    var cStarts = [0, 2, 4, 6];
    var cEnds = [1, 3, 5, 7];

    // Цикл от 0 до 4
    for (var i = 0; i < 4; i++) {
      // Создание переменных cStart и cEnd
      var cStart = cornerVertNumber * cStarts[i];
      var cEnd = cornerVertNumber * cEnds[i];

      // Создание переменной needsFlip, если i меньше или равно 1, ей присваивается значение true, иначе false
      var needsFlip = 1 >= i;

      // Цикл от 0 до radiusSegments
      for (var u = 0; u < radiusSegments; u++) {
        // Создание переменных urs1 и u1rs1
        var urs1 = u * rs1;
        var u1rs1 = (u + 1) * rs1;

        // Создание переменных a, b, c, d
        var a = cStart + urs1;
        var b = cStart + u1rs1;
        var c = cEnd + urs1;
        var d = cEnd + u1rs1;

        // Если needsFlip равен true, то индексы добавляются в массив indices в порядке a, c, b, b, c, d, иначе в порядке a, b, c, b, d, c
        if (needsFlip) {
          indices.push(a);
          indices.push(c);
          indices.push(b);
          indices.push(b);
          indices.push(c);
          indices.push(d);
        } else {
          indices.push(a);
          indices.push(b);
          indices.push(c);
          indices.push(b);
          indices.push(d);
          indices.push(c);
        }
      }
    }
  }

  // Определяем функцию doWidthEdges
  function doWidthEdges() {
    // Задаем переменную end, равную radiusSegments - 1
    var end = radiusSegments - 1;

    var cStarts = [0, 1, 4, 5]; // Создаем массив cStarts и задаем ему значения [0, 1, 4, 5]
    var cEnds = [3, 2, 7, 6]; // Создаем массив cEnds и задаем ему значения [3, 2, 7, 6]
    var needsFlip = [0, 1, 1, 0]; // Создаем массив needsFlip и задаем ему значения [0, 1, 1, 0]

    // Создаем цикл, который будет повторяться 4 раза
    for (var i = 0; i < 4; i++) {
      var cStart = cStarts[i] * cornerVertNumber; // Создаем переменную cStart, равную i-тому элементу массива cStarts, умноженному на cornerVertNumber
      var cEnd = cEnds[i] * cornerVertNumber; // Создаем переменную cEnd, равную i-тому элементу массива cEnds, умноженному на cornerVertNumber

      // Создаем цикл, который будет повторяться от 0 до end включительно
      for (var u = 0; u <= end; u++) {
        var a = cStart + radiusSegments + u * rs1; // Создаем переменную a, равную cStart + radiusSegments + u * rs1
        var b =
          cStart +
          (u != end ? radiusSegments + (u + 1) * rs1 : cornerVertNumber - 1); // Создаем переменную b, равную cStart + (u != end ? radiusSegments + (u + 1) * rs1 : cornerVertNumber - 1)

        var c = cEnd + radiusSegments + u * rs1; // Создаем переменную c, равную cEnd + radiusSegments + u * rs1
        var d =
          cEnd +
          (u != end ? radiusSegments + (u + 1) * rs1 : cornerVertNumber - 1); // Создаем переменную d, равную cEnd + (u != end ? radiusSegments + (u + 1) * rs1 : cornerVertNumber - 1)

        // Если needsFlip[i] равно false
        if (!needsFlip[i]) {
          // Добавляем a, b, c в массив indices
          indices.push(a);
          indices.push(b);
          indices.push(c);
          // Добавляем b, d, c в массив indices
          indices.push(b);
          indices.push(d);
          indices.push(c);

          // Если needsFlip[i] равно true
        } else {
          // Добавляем a, c, b в массив indices
          indices.push(a);
          indices.push(c);
          indices.push(b);
          // Добавляем b, c, d в массив indices
          indices.push(b);
          indices.push(c);
          indices.push(d);
        }
      }
    }
  }

  var index = 0; // задаём начальный индекс

  // проходим циклом по каждому элементу в vertexPool
  for (var i = 0; i < vertexPool.length; i++) {
    positions.setXYZ(
      // устанавливаем координаты вершины в positions
      index, // индекс вершины
      vertexPool[i].x, // x координата
      vertexPool[i].y, // y координата
      vertexPool[i].z // z координата
    );

    normals.setXYZ(
      // устанавливаем нормали для вершины в normals
      index, // индекс вершины
      normalPool[i].x, // x компонента нормали
      normalPool[i].y, // y компонента нормали
      normalPool[i].z // z компонента нормали
    );

    index++; // увеличиваем индекс для следующей вершины
  }

  this.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1)); // устанавливаем индекс буферной геометрии
  this.addAttribute("position", positions); // добавляем атрибут позиции в буферную геометрию
  this.addAttribute("normal", normals); // добавляем атрибут нормалей в буферную геометрию
}

// Создание нового объекта RoundedBoxGeometry, который наследуется от BufferGeometry
RoundedBoxGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
RoundedBoxGeometry.constructor = RoundedBoxGeometry;

// Создание функции RoundedPlaneGeometry, которая принимает размер, радиус и глубину
function RoundedPlaneGeometry(size, radius, depth) {
  var x, y, width, height;

  // Расчёт начальных значений координат и ширины/высоты
  x = y = -size / 2;
  width = height = size;
  radius = size * radius;

  // Создание фигуры Shape для экструзии
  const shape = new THREE.Shape();

  // Задание вершин для фигуры Shape с помощью кривых Безье
  shape.moveTo(x, y + radius);
  shape.lineTo(x, y + height - radius);
  shape.quadraticCurveTo(x, y + height, x + radius, y + height);
  shape.lineTo(x + width - radius, y + height);
  shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
  shape.lineTo(x + width, y + radius);
  shape.quadraticCurveTo(x + width, y, x + width - radius, y);
  shape.lineTo(x + radius, y);
  shape.quadraticCurveTo(x, y, x, y + radius);

  // Создание объекта geometry с помощью класса ExtrudeBufferGeometry
  const geometry = new THREE.ExtrudeBufferGeometry(shape, {
    depth: depth,
    bevelEnabled: false,
    curveSegments: 3,
  });

  return geometry; // Возврат объекта geometry
}

// Создаем класс Cube (куб)
class Cube {
  // Конструктор класса, принимающий объект game
  constructor(game) {
    // Задаем свойства куба
    this.game = game;
    this.size = 3;

    // Задаем геометрические параметры куба
    this.geometry = {
      pieceCornerRadius: 0.12,
      edgeCornerRoundness: 0.15,
      edgeScale: 0.82,
      edgeDepth: 0.01,
    };

    // Создаем объекты куба
    this.holder = new THREE.Object3D();
    this.object = new THREE.Object3D();
    this.animator = new THREE.Object3D();

    // Добавляем объекты в иерархию
    this.holder.add(this.animator);
    this.animator.add(this.object);

    // Добавляем куб на сцену
    this.game.world.scene.add(this.holder);
  }

  // Начало метода init()
  init() {
    // Создаем пустой массив для хранения кубов и очищаем детей объекта
    this.cubes = [];
    this.object.children = [];
    this.object.add(this.game.controls.group); // Добавляем группу контролов в качестве ребенка объекта

    // Выбираем масштаб для объекта в зависимости от размера и задаем его
    if (this.size === 2) this.scale = 1.25;
    else if (this.size === 3) this.scale = 1;
    else if (this.size > 3) this.scale = 3 / this.size;

    this.object.scale.set(this.scale, this.scale, this.scale);

    // Задаем масштаб для границ контролов в зависимости от размера
    const controlsScale = this.size === 2 ? 0.825 : 1;
    this.game.controls.edges.scale.set(
      controlsScale,
      controlsScale,
      controlsScale
    );

    this.generatePositions(); // Генерируем позиции элементов кубика Рубика
    this.generateModel(); // Генерируем модель кубика Рубика на основе позиций

    // Добавляем каждый элемент в объект и сохраняем его куб в массиве кубов
    this.pieces.forEach((piece) => {
      this.cubes.push(piece.userData.cube);
      this.object.add(piece);
    });

    // Обходим каждый узел в дочерних элементах объекта и отключаем его усечение фрустумом
    this.holder.traverse((node) => {
      if (node.frustumCulled) node.frustumCulled = false;
    });

    // Обновляем цвета в соответствии с выбранной темой
    this.updateColors(this.game.themes.getColors());

    // Сохраняем размер кубика Рубика для будущей проверки
    this.sizeGenerated = this.size;
  }

  resize(force = false) {
    //Объявление функции resize, которая принимает один необязательный параметр force со значением по умолчанию false

    if (this.size !== this.sizeGenerated || force) {
      //Если значение this.size не равно значению this.sizeGenerated ИЛИ force равно true, то выполняется следующий блок кода

      this.size = this.game.preferences.ranges.size.value; //Обновление значения переменной this.size с помощью значения из объекта this.game.preferences.ranges.size.value

      //Вызов функций reset и init
      this.reset();
      this.init();

      //Обновление значения свойства this.game.saved на false, вызов метода reset объекта this.game.timer и вызов метода clearGame объекта this.game.storage
      this.game.saved = false;
      this.game.timer.reset();
      this.game.storage.clearGame();
    }
  }

  reset() {
    //Объявление функции reset

    this.game.controls.edges.rotation.set(0, 0, 0); //Обновление значений свойства rotation объекта this.game.controls.edges на (0, 0, 0)

    // /Обновление значений свойства rotation объектов this.holder, this.object и this.animator на (0, 0, 0)
    this.holder.rotation.set(0, 0, 0);
    this.object.rotation.set(0, 0, 0);
    this.animator.rotation.set(0, 0, 0);
  }

  // Создание метода generatePositions() в текущем объекте
  generatePositions() {
    const m = this.size - 1; // Размерность (размер) текущего объекта минус 1, записываем в переменную m
    // Вычисление значения переменной first в зависимости от четности размерности объекта
    const first =
      this.size % 2 !== 0 ? 0 - Math.floor(this.size / 2) : 0.5 - this.size / 2;

    // Объявление переменных x, y, z
    let x, y, z;

    // Очистка массива позиций объектов (positions)
    this.positions = [];

    // Цикл по всем координатам объекта
    for (x = 0; x < this.size; x++) {
      for (y = 0; y < this.size; y++) {
        for (z = 0; z < this.size; z++) {
          // Создание нового объекта типа Vector3 с координатами x, y, z, сдвинутыми на значение first
          let position = new THREE.Vector3(first + x, first + y, first + z);
          let edges = []; // Создание массива ребер edges объекта position

          if (x == 0) edges.push(0); // Если x = 0, добавить значение 0 в массив edges
          if (x == m) edges.push(1); // Если x = m, добавить значение 1 в массив edges
          if (y == 0) edges.push(2); // Если y = 0, добавить значение 2 в массив edges
          if (y == m) edges.push(3); // Если y = m, добавить значение 3 в массив edges
          if (z == 0) edges.push(4); // Если z = 0, добавить значение 4 в массив edges
          if (z == m) edges.push(5); // Если z = m, добавить значение 5 в массив edges

          // Добавление массива edges к объекту position и добавление position в массив positions
          position.edges = edges;
          this.positions.push(position);
        }
      }
    }
  }

  generateModel() {
    // создание пустых массивов
    this.pieces = [];
    this.edges = [];

    // задание размера кусочка и создание материала
    const pieceSize = 1 / 3;
    const mainMaterial = new THREE.MeshLambertMaterial();

    // создание меша для кусочка и его геометрии
    const pieceMesh = new THREE.Mesh(
      new RoundedBoxGeometry(pieceSize, this.geometry.pieceCornerRadius, 3),
      mainMaterial.clone()
    );

    // создание геометрии для края головоломки
    const edgeGeometry = RoundedPlaneGeometry(
      pieceSize,
      this.geometry.edgeCornerRoundness,
      this.geometry.edgeDepth
    );

    // Обращаемся к свойству positions
    this.positions.forEach((position, index) => {
      const piece = new THREE.Object3D(); // Создаем новый объект-контейнер
      const pieceCube = pieceMesh.clone(); // Копируем Mesh для куба
      const pieceEdges = []; // Создаем массив для ребер объекта

      piece.position.copy(position.clone().divideScalar(3)); // Устанавливаем позицию объекта-контейнера
      piece.add(pieceCube); // Добавляем Mesh куба в объект-контейнер
      piece.name = index; // Устанавливаем имя объекта-контейнера
      piece.edgesName = ""; // Устанавливаем имя объекта-контейнера для его ребер

      // Добавляем ребра в объект-контейнер
      position.edges.forEach((position) => {
        const edge = new THREE.Mesh(edgeGeometry, mainMaterial.clone()); // Создаем новый Mesh для ребра
        const name = ["L", "R", "D", "U", "B", "F"][position]; // Называем ребро в соответствии с его позицией
        const distance = pieceSize / 2; // Устанавливаем расстояние до ребра

        // Устанавливаем позицию ребра относительно объекта-контейнера
        edge.position.set(
          distance * [-1, 1, 0, 0, 0, 0][position],
          distance * [0, 0, -1, 1, 0, 0][position],
          distance * [0, 0, 0, 0, -1, 1][position]
        );

        // Устанавливаем поворот ребра относительно объекта-контейнера
        edge.rotation.set(
          (Math.PI / 2) * [0, 0, 1, -1, 0, 0][position],
          (Math.PI / 2) * [-1, 1, 0, 0, 2, 0][position],
          0
        );

        // Устанавливаем масштаб ребра
        edge.scale.set(
          this.geometry.edgeScale,
          this.geometry.edgeScale,
          this.geometry.edgeScale
        );

        edge.name = name; // Устанавливаем имя ребра

        piece.add(edge); // Добавляем ребро в объект-контейнер
        pieceEdges.push(name); // Добавляем имя ребра в массив ребер объекта
        this.edges.push(edge); // Добавляем ребро в общий массив ребер
      });

      piece.userData.edges = pieceEdges; // Устанавливаем для пользовательских данных объекта piece свойство edges, равное значению переменной pieceEdges
      piece.userData.cube = pieceCube; // Устанавливаем для пользовательских данных объекта piece свойство cube, равное значению переменной pieceCube

      // Устанавливаем для пользовательских данных объекта piece свойство start, которое содержит клонированные значения position и rotation объекта piece
      piece.userData.start = {
        position: piece.position.clone(),
        rotation: piece.rotation.clone(),
      };

      // Добавляем объект piece в массив pieces текущего объекта.
      this.pieces.push(piece);
    });
  }

  updateColors(colors) {
    // Если массивы `pieces` и `edges` не являются объектами, возвращаемся из функции
    if (typeof this.pieces !== "object" && typeof this.edges !== "object")
      return;

    // Применяем цвета `P` ко всем элементам массива `pieces`, а цвета элементов массива `edges` устанавливаем в соответствии с их именами
    this.pieces.forEach((piece) =>
      piece.userData.cube.material.color.setHex(colors.P)
    );
    this.edges.forEach((edge) => edge.material.color.setHex(colors[edge.name]));
  }

  loadFromData(data) {
    this.size = data.size; // Устанавливаем размер кубика из данных

    // Обнуляем кубик и инициализируем его заново
    this.reset();
    this.init();

    // Для каждого элемента массива `pieces` устанавливаем соответствующие значения позиции и поворота из данных
    this.pieces.forEach((piece) => {
      const index = data.names.indexOf(piece.name); // Находим индекс кубической части в переданных данных

      // Получаем позицию и ориентацию для этой части
      const position = data.positions[index];
      const rotation = data.rotations[index];

      // Устанавливаем позицию и ориентацию для этой части
      piece.position.set(position.x, position.y, position.z);
      piece.rotation.set(rotation.x, rotation.y, rotation.z);
    });
  }
}

// Объект Easing, содержащий различные функции для плавности анимации
const Easing = {
  // Функции в стиле Power In/Out/InOut с параметром power
  Power: {
    // Power In - плавное появление
    In: (power) => {
      power = Math.round(power || 1); // Если параметр power не задан, установить значение 1

      return (t) => Math.pow(t, power); // Возвращает функцию t с плавным появлением
    },

    // Power Out - плавное исчезание
    Out: (power) => {
      power = Math.round(power || 1); // Если параметр power не задан, установить значение 1

      return (t) => 1 - Math.abs(Math.pow(t - 1, power)); // Возвращает функцию t с плавным исчезанием
    },

    // Power InOut - плавное появление и исчезание
    InOut: (power) => {
      power = Math.round(power || 1); // Если параметр power не задан, установить значение 1

      // Возвращает функцию t с плавным появлением и исчезанием
      return (t) =>
        t < 0.5
          ? Math.pow(t * 2, power) / 2
          : (1 - Math.abs(Math.pow(t * 2 - 1 - 1, power))) / 2 + 0.5;
    },
  },

  Sine: {
    In: () => (t) => 1 + Math.sin((Math.PI / 2) * t - Math.PI / 2), // In - кривая начинается медленно, затем ускоряется

    Out: () => (t) => Math.sin((Math.PI / 2) * t), // Out - кривая начинается быстро, затем замедляется

    InOut: () => (t) => (1 + Math.sin(Math.PI * t - Math.PI / 2)) / 2, // InOut - кривая начинается медленно, затем ускоряется, затем замедляется
  },

  Back: {
    // Out - кривая начинается быстро, затем замедляется, и затем сильно ускоряется к концу
    Out: (s) => {
      s = s || 1.70158;

      return (t) => {
        return (t -= 1) * t * ((s + 1) * t + s) + 1;
      };
    },

    // In - кривая начинается медленно, затем ускоряется, и затем замедляется к концу
    In: (s) => {
      s = s || 1.70158;

      return (t) => {
        return t * t * ((s + 1) * t - s);
      };
    },
  },

  Elastic: {
    Out: (amplitude, period) => {
      let PI2 = Math.PI * 2;

      let p1 = amplitude >= 1 ? amplitude : 1; // Если амплитуда >= 1, то присвоить p1 значение амплитуды, иначе 1
      let p2 = (period || 0.3) / (amplitude < 1 ? amplitude : 1); // Если период не задан, присвоить 0.3
      let p3 = (p2 / PI2) * (Math.asin(1 / p1) || 0); // Вычисление p3

      p2 = PI2 / p2; // Вычисление p2

      // Возвращает функцию, которая вычисляет значение по времени t
      return (t) => {
        return p1 * Math.pow(2, -10 * t) * Math.sin((t - p3) * p2) + 1;
      };
    },
  },
};

// Создаем класс Tween, который наследуется от класса Animation
class Tween extends Animation {
  // Конструктор класса
  constructor(options) {
    super(false); // Вызываем конструктор родительского класса

    // Устанавливаем значения свойств объекта options или значения по умолчанию, если они не заданы
    this.duration = options.duration || 500;
    this.easing = options.easing || ((t) => t);
    this.onUpdate = options.onUpdate || (() => {});
    this.onComplete = options.onComplete || (() => {});

    this.delay = options.delay || false;
    this.yoyo = options.yoyo ? false : null;

    // Инициализируем переменные
    this.progress = 0;
    this.value = 0;
    this.delta = 0;

    this.getFromTo(options); // Вызываем метод getFromTo, который задает начальное и конечное значение анимации

    // Если задано значение delay, то задерживаем старт анимации на определенный период времени
    if (this.delay) setTimeout(() => super.start(), this.delay);
    else super.start();

    this.onUpdate(this); // Вызываем функцию обновления анимации
  }

  // Обновление значения анимации с учетом прошедшего времени
  update(delta) {
    const old = this.value * 1; // Сохранение предыдущего значения анимации
    const direction = this.yoyo === true ? -1 : 1; // Определение направления анимации

    this.progress += (delta / this.duration) * direction; // Изменение прогресса анимации в соответствии с прошедшим временем

    this.value = this.easing(this.progress); // Обновление значения анимации в соответствии с выбранной функцией эффекта
    this.delta = this.value - old; // Вычисление изменения значения анимации за промежуток времени

    if (this.values !== null) this.updateFromTo(); // Если установлено "to" значение, то его нужно обновить

    if (this.yoyo !== null)
      this.updateYoyo(); // Если анимация движется в обратном направлении, то её нужно обновить
    else if (this.progress <= 1)
      this.onUpdate(
        this
      ); // Если анимация еще не закончена, вызываем функцию onUpdate
    // Иначе анимация завершена
    else {
      // Установка прогресса и значения на максимум
      this.progress = 1;
      this.value = 1;
      // Вызов функции onUpdate и onComplete
      this.onUpdate(this);
      this.onComplete(this);
      // Остановка анимации
      super.stop();
    }
  }

  // Обновляет значение анимации с учетом свойства 'Yoyo'
  updateYoyo() {
    if (this.progress > 1 || this.progress < 0) {
      // Если значение прогресса больше 1 или меньше 0

      this.value = this.progress = this.progress > 1 ? 1 : 0; // То присваиваем значение 1, если больше 1, и 0, если меньше 0
      this.yoyo = !this.yoyo; // И инвертируем свойство 'yoyo'
    }

    this.onUpdate(this); // Вызывает функцию обновления
  }

  // Обновляет значения от и до
  updateFromTo() {
    this.values.forEach((key) => {
      // Перебираем ключи значений

      this.target[key] =
        this.from[key] + (this.to[key] - this.from[key]) * this.value; // Изменяем значение ключей в соответствии с прогрессом анимации
    });
  }

  // Получает значения от и до
  getFromTo(options) {
    if (!options.target || !options.to) {
      // Если не переданы параметры 'target' или 'to'

      this.values = null; // То значение свойства 'values' равно null
      return;
    }

    this.target = options.target || null; // Присваиваем значение свойства 'target'
    this.from = options.from || {}; // Присваиваем значение свойства 'from'
    this.to = options.to || null; // Присваиваем значение свойства 'to'
    this.values = []; // Создаем массив для ключей значений

    if (Object.keys(this.from).length < 1)
      // Если объект 'from' пустой
      Object.keys(this.to).forEach((key) => {
        this.from[key] = this.target[key];
      }); // То присваиваем объекту 'from' ключи из объекта 'to', со значениями, полученными из свойства 'target'

    Object.keys(this.to).forEach((key) => {
      this.values.push(key);
    }); // Записываем все ключи объекта 'to' в массив 'values'
  }
}

window.addEventListener("touchmove", () => {}); // Добавляем слушатель события touchmove на окно браузера и ничего не делаем
document.addEventListener(
  "touchmove",
  (event) => {
    event.preventDefault();
  },
  { passive: false }
); // Добавляем слушатель события touchmove на документ и предотвращаем его стандартное поведение, если параметр passive равен false

// Объявляем класс Draggable
class Draggable {
  // Создаем конструктор класса, который принимает элемент и настройки
  constructor(element, options) {
    // Создаем объект position, который содержит информацию о текущей позиции, начальной позиции, изменении позиции, предыдущей позиции и перетаскивании
    this.position = {
      current: new THREE.Vector2(),
      start: new THREE.Vector2(),
      delta: new THREE.Vector2(),
      old: new THREE.Vector2(),
      drag: new THREE.Vector2(),
    };

    // Создаем объект options, который содержит настройки, переданные в конструктор
    this.options = Object.assign(
      {
        calcDelta: false,
      },
      options || {}
    );

    // Присваиваем свойству element элемент, переданный в конструктор
    this.element = element;
    // Изначально переменная touch равна null
    this.touch = null;

    // Объявляем объект drag, который содержит методы для начала, перемещения и окончания перетаскивания
    this.drag = {
      start: (event) => {
        // Если тип события 'mousedown' и нажата не левая кнопка мыши, то ничего не делаем
        if (event.type == "mousedown" && event.which != 1) return;
        // Если тип события 'touchstart' и касаний больше, чем одно, то ничего не делаем
        if (event.type == "touchstart" && event.touches.length > 1) return;

        this.getPositionCurrent(event); // Получаем текущую позицию

        // Если параметр calcDelta равен true, то обнуляем свойства start, delta и drag объекта position
        if (this.options.calcDelta) {
          this.position.start = this.position.current.clone();
          this.position.delta.set(0, 0);
          this.position.drag.set(0, 0);
        }

        // Если тип события touchstart, то переменная touch равна true
        this.touch = event.type == "touchstart";

        // Вызываем метод onDragStart и передаем ему объект position
        this.onDragStart(this.position);

        // Добавляем слушатель события move на окно браузера и вызываем метод drag.move
        window.addEventListener(
          this.touch ? "touchmove" : "mousemove",
          this.drag.move,
          false
        );
        // Добавляем слушатель события end на окно браузера и вызываем метод drag.end
        window.addEventListener(
          this.touch ? "touchend" : "mouseup",
          this.drag.end,
          false
        );
      },

      // Функция "move" будет выполнена при перемещении объекта
      move: (event) => {
        // Если необходимо, вычисляем изменение позиции
        if (this.options.calcDelta) {
          // Сохраняем текущую позицию как старую
          this.position.old = this.position.current.clone();
        }

        // Получаем текущую позицию объекта
        this.getPositionCurrent(event);

        // Если необходимо, вычисляем разницу между старой и новой позициями
        if (this.options.calcDelta) {
          // Вычисляем дельту
          this.position.delta = this.position.current
            .clone()
            .sub(this.position.old);
          // Вычисляем смещение
          this.position.drag = this.position.current
            .clone()
            .sub(this.position.start);
        }

        // Вызываем функцию onDragMove, чтобы обработать перемещение объекта
        this.onDragMove(this.position);
      },

      // Функция "end" будет выполнена при завершении перемещения объекта
      end: (event) => {
        // Получаем текущую позицию объекта
        this.getPositionCurrent(event);

        // Вызываем функцию onDragEnd, чтобы обработать завершение перемещения объекта
        this.onDragEnd(this.position);

        // Удаляем обработчики событий мыши или тача
        window.removeEventListener(
          this.touch ? "touchmove" : "mousemove",
          this.drag.move,
          false
        );
        window.removeEventListener(
          this.touch ? "touchend" : "mouseup",
          this.drag.end,
          false
        );
      },
    };

    // Создание и инициализация функций-обработчиков
    this.onDragStart = () => {};
    this.onDragMove = () => {};
    this.onDragEnd = () => {};

    this.enable(); // Включение возможности перетаскивания

    return this; // Возврат объекта класса для цепочки вызовов
  }

  // Функция для включения возможности перетаскивания
  enable() {
    // Добавление обработчиков событий для событий касания и клика
    this.element.addEventListener("touchstart", this.drag.start, false);
    this.element.addEventListener("mousedown", this.drag.start, false);

    // Возврат объекта класса для цепочки вызовов
    return this;
  }

  // Функция для отключения возможности перетаскивания
  disable() {
    // Удаление обработчиков событий для событий касания и клика
    this.element.removeEventListener("touchstart", this.drag.start, false);
    this.element.removeEventListener("mousedown", this.drag.start, false);

    // Возврат объекта класса для цепочки вызовов
    return this;
  }

  // Определение функции getPositionCurrent, которая получает текущее положение курсора/пальца
  getPositionCurrent(event) {
    // Определение dragEvent в зависимости от типа события
    const dragEvent = event.touches
      ? event.touches[0] || event.changedTouches[0]
      : event;

    // Установка координат текущего положения в объект this.position.current
    this.position.current.set(dragEvent.pageX, dragEvent.pageY);
  }

  // Определение функции convertPosition, которая конвертирует координаты положения курсора/пальца
  convertPosition(position) {
    // Конвертация координат положения курсора/пальца в диапазон от -1 до 1
    position.x = (position.x / this.element.offsetWidth) * 2 - 1;
    position.y = -((position.y / this.element.offsetHeight) * 2 - 1);

    return position; // Возврат сконвертированных координат
  }
}

// Объявление констант STILL, PREPARING, ROTATING, ANIMATING с их соответствующими значениями
const STILL = 0;
const PREPARING = 1;
const ROTATING = 2;
const ANIMATING = 3;

// Объявление класса Controls
class Controls {
  // Конструктор, принимающий объект game
  constructor(game) {
    // Присваивание переданного объекта game к свойству this.game
    this.game = game;

    // Начальное значение flipConfig равно 0
    this.flipConfig = 0;

    // Задание трёх массивов: flipEasings, flipSpeeds и momentum
    this.flipEasings = [
      Easing.Power.Out(3),
      Easing.Sine.Out(),
      Easing.Back.Out(1.5),
    ];
    this.flipSpeeds = [125, 200, 300];

    // Создание экземпляра класса Raycaster из библиотеки Three.js
    this.raycaster = new THREE.Raycaster();

    // Создание материала для отображения вспомогательных элементов
    const helperMaterial = new THREE.MeshBasicMaterial({
      depthWrite: false,
      transparent: true,
      opacity: 0,
      color: 0x0033ff,
    });

    // Создание контейнера для элементов управления
    this.group = new THREE.Object3D();
    this.group.name = "controls";
    this.game.cube.object.add(this.group);

    // Создание вспомогательного элемента типа Mesh (плоскость)
    this.helper = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(200, 200),
      helperMaterial.clone()
    );

    // Поворот вспомогательного элемента на 45 градусов по оси Y
    this.helper.rotation.set(0, Math.PI / 4, 0);
    // Добавление вспомогательного элемента в сцену
    this.game.world.scene.add(this.helper);

    // Создание вспомогательного элемента типа Mesh (куб)
    this.edges = new THREE.Mesh(
      new THREE.BoxBufferGeometry(1, 1, 1),
      helperMaterial.clone()
    );

    // Добавление вспомогательного элемента в сцену
    this.game.world.scene.add(this.edges);

    // Задание пустых функций onSolved и onMove
    this.onSolved = () => {};
    this.onMove = () => {};

    this.momentum = [];

    // Задание начальных значений для scramble, state и enabled
    this.scramble = null;
    this.state = STILL;
    this.enabled = false;

    // Инициализация возможности перетаскивания элементов
    this.initDraggable();
  }

  // Начало метода "enable"
  enable() {
    // Включаем возможность перетаскивания
    this.draggable.enable();
    // Устанавливаем значение "enabled" в "true"
    this.enabled = true;
  }

  // Начало метода "disable"
  disable() {
    // Отключаем возможность перетаскивания
    this.draggable.disable();
    // Устанавливаем значение "enabled" в "false"
    this.enabled = false;
  }

  // Начало метода "initDraggable"
  initDraggable() {
    // Создаем экземпляр объекта "Draggable"
    this.draggable = new Draggable(this.game.dom.game);

    // Устанавливаем обработчик события "onDragStart"
    this.draggable.onDragStart = (position) => {
      // Если куб перемешивается, прерываем выполнение метода
      if (this.scramble !== null) return;
      // Если куб готовится или уже вращается, прерываем выполнение метода
      if (this.state === PREPARING || this.state === ROTATING) return;

      this.gettingDrag = this.state === ANIMATING;

      // Определяем, находится ли курсор на ребре куба
      const edgeIntersect = this.getIntersect(
        position.current,
        this.edges,
        false
      );

      // Если курсор находится на ребре
      if (edgeIntersect !== false) {
        // Определяем, находится ли курсор внутри какого-либо кубика
        this.dragIntersect = this.getIntersect(
          position.current,
          this.game.cube.cubes,
          true
        );
      }

      // Если курсор находится на ребре и внутри кубика
      if (edgeIntersect !== false && this.dragIntersect !== false) {
        // Определяем направление вектора нормали к ребру
        this.dragNormal = edgeIntersect.face.normal.round();
        // Устанавливаем тип вращения "layer"
        this.flipType = "layer";

        // Присоединяем вспомогательный объект к ребру
        this.attach(this.helper, this.edges);

        // Сбрасываем положение и повороты вспомогательного объекта
        this.helper.rotation.set(0, 0, 0);
        this.helper.position.set(0, 0, 0);
        // Направляем вспомогательный объект в направлении нормали
        this.helper.lookAt(this.dragNormal);
        this.helper.translateZ(0.5);
        this.helper.updateMatrixWorld();

        // Отсоединяем вспомогательный объект от ребра
        this.detach(this.helper, this.edges);
      } else {
        // Если курсор не находится на ребре или внутри кубика
        // Устанавливаем направление вектора нормали по умолчанию
        this.dragNormal = new THREE.Vector3(0, 0, 1);
        // Устанавливаем тип вращения "cube"
        this.flipType = "cube";

        // Установка положения и поворота вспомогательного объекта
        this.helper.position.set(0, 0, 0);
        this.helper.rotation.set(0, Math.PI / 4, 0);
        // Обновление матрицы мира вспомогательного объекта
        this.helper.updateMatrixWorld();
      }

      // Получение точки пересечения плоскости с помощью getIntersect
      let planeIntersect = this.getIntersect(
        position.current,
        this.helper,
        false
      );
      // Если точка пересечения не найдена, выходим из функции
      if (planeIntersect === false) return;

      // Преобразование координат точки пересечения в локальные координаты вспомогательного объекта
      this.dragCurrent = this.helper.worldToLocal(planeIntersect.point);
      // Создание нового вектора для общего смещения мыши
      this.dragTotal = new THREE.Vector3();
      // Изменение состояния перетаскивания
      this.state = this.state === STILL ? PREPARING : this.state;
    };

    // Обработчик движения перетаскивания
    this.draggable.onDragMove = (position) => {
      // Если выполняется scramble, не делать ничего
      if (this.scramble !== null) return;
      // Если кубик не находится в движении или его только что начали двигать, не делать ничего
      if (
        this.state === STILL ||
        (this.state === ANIMATING && this.gettingDrag === false)
      )
        return;

      // Получаем точку пересечения плоскости куба
      const planeIntersect = this.getIntersect(
        position.current,
        this.helper,
        false
      );
      // Если точки пересечения нет, не делать ничего
      if (planeIntersect === false) return;

      // Преобразуем точку пересечения в локальную систему координат куба
      const point = this.helper.worldToLocal(planeIntersect.point.clone());

      // Получаем вектор перемещения кубика
      this.dragDelta = point.clone().sub(this.dragCurrent).setZ(0);
      // Обновляем общий вектор перемещения
      this.dragTotal.add(this.dragDelta);
      // Обновляем текущую точку пересечения
      this.dragCurrent = point;
      // Добавляем новую точку момента импульса в массив точек
      this.addMomentumPoint(this.dragDelta);

      // Проверяем состояние, если мы находимся в стадии подготовки и величина перетаскивания превышает 0.05
      if (this.state === PREPARING && this.dragTotal.length() > 0.05) {
        // Определяем главную ось, по которой будем вращать объект
        this.dragDirection = this.getMainAxis(this.dragTotal);

        // Если тип переворота - "слой", то мы определяем направление переворота и ось переворота
        if (this.flipType === "layer") {
          // Создаем новый вектор направления
          const direction = new THREE.Vector3();
          // Задаем направление для главной оси
          direction[this.dragDirection] = 1;

          // Переводим мировые координаты в локальные
          const worldDirection = this.helper
            .localToWorld(direction)
            .sub(this.helper.position);
          // Определяем направление объекта
          const objectDirection = this.edges
            .worldToLocal(worldDirection)
            .round();

          // Определяем ось переворота
          this.flipAxis = objectDirection.cross(this.dragNormal).negate();

          // Выбираем слой, который будем вращать
          this.selectLayer(this.getLayer(false));
        } else {
          // Определяем ось переворота
          const axis =
            this.dragDirection != "x"
              ? this.dragDirection == "y" &&
                position.current.x > this.game.world.width / 2
                ? "z"
                : "x"
              : "y";

          // Задаем ось переворота
          this.flipAxis = new THREE.Vector3();
          this.flipAxis[axis] = 1 * (axis == "x" ? -1 : 1);
        }

        // Задаем начальный угол переворота и меняем состояние на "вращение"
        this.flipAngle = 0;
        this.state = ROTATING;

        // Если мы находимся в стадии вращения
      } else if (this.state === ROTATING) {
        // Получаем угол вращения
        const rotation = this.dragDelta[this.dragDirection];

        // Если тип переворота - "слой", то мы вращаем группу объектов
        if (this.flipType === "layer") {
          this.group.rotateOnAxis(this.flipAxis, rotation);
          this.flipAngle += rotation;

          // Иначе, если тип переворота - "куб", то мы вращаем грани куба
        } else {
          this.edges.rotateOnWorldAxis(this.flipAxis, rotation);
          this.game.cube.object.rotation.copy(this.edges.rotation);
          this.flipAngle += rotation;
        }
      }
    };

    // Назначаем функцию обработчика события 'onDragEnd', которая будет вызвана при окончании перетаскивания объекта
    this.draggable.onDragEnd = (position) => {
      // Проверяем, находимся ли мы в режиме перемешивания (scramble) или нет. Если да, то выходим из функции
      if (this.scramble !== null) return;
      // Проверяем, находимся ли мы в режиме вращения (ROTATING) объекта. Если нет, то выходим из функции
      if (this.state !== ROTATING) {
        this.gettingDrag = false;
        this.state = STILL;
        return;
      }

      // Меняем состояние объекта на ANIMATING
      this.state = ANIMATING;

      // Вычисляем импульс объекта
      const momentum = this.getMomentum()[this.dragDirection];
      // Проверяем, происходит ли переворот кубика. Если да, то устанавливаем значение переменной flip в true
      const flip =
        Math.abs(momentum) > 0.05 && Math.abs(this.flipAngle) < Math.PI / 2;

      // Вычисляем угол поворота в зависимости от того, происходит ли переворот кубика или нет
      const angle = flip
        ? this.roundAngle(
            this.flipAngle + Math.sign(this.flipAngle) * (Math.PI / 4)
          )
        : this.roundAngle(this.flipAngle);

      // Вычисляем разницу между текущим и новым углом поворота
      const delta = angle - this.flipAngle;

      // Если тип вращения 'layer', то вызываем функцию rotateLayer с вычисленным углом поворота и другими параметрами
      if (this.flipType === "layer") {
        this.rotateLayer(delta, false, (layer) => {
          // Сохраняем игру
          this.game.storage.saveGame();

          // Меняем состояние объекта на PREPARING или STILL
          this.state = this.gettingDrag ? PREPARING : STILL;
          this.gettingDrag = false;

          // Проверяем, решен ли кубик
          this.checkIsSolved();
        });
      } else {
        // Если тип вращения не 'layer', то вызываем функцию rotateCube с вычисленным углом поворота и другими параметрами
        this.rotateCube(delta, () => {
          // Меняем состояние объекта на PREPARING или STILL
          this.state = this.gettingDrag ? PREPARING : STILL;
          this.gettingDrag = false;
        });
      }
    };
  }

  // Функция поворота слоя кубика с использованием анимации
  rotateLayer(rotation, scramble, callback) {
    // Установка конфигурации анимации в зависимости от режима сборки (scramble)
    const config = scramble ? 0 : this.flipConfig;

    // Определение типа анимации, ее продолжительности и функции отскока (bounce)
    const easing = this.flipEasings[config];
    const duration = this.flipSpeeds[config];
    const bounce = config == 2 ? this.bounceCube() : () => {};

    // Создание объекта анимации
    this.rotationTween = new Tween({
      easing: easing,
      duration: duration,
      // Вызов функции на каждом шаге анимации
      onUpdate: (tween) => {
        // Определение угла поворота на текущем шаге анимации и поворота слоя кубика
        let deltaAngle = tween.delta * rotation;
        this.group.rotateOnAxis(this.flipAxis, deltaAngle);
        // Вызов функции отскока
        bounce(tween.value, deltaAngle, rotation);
      },
      // Вызов функции по завершении анимации
      onComplete: () => {
        // Если это не режим сборки, то выполнить функцию onMove
        if (!scramble) this.onMove();

        // Сохранение состояния повернутого слоя
        const layer = this.flipLayer.slice(0);

        // Обновление углов поворота кубика и повернутого слоя, снятие выделения с повернутого слоя
        this.game.cube.object.rotation.setFromVector3(
          this.snapRotation(this.game.cube.object.rotation.toVector3())
        );
        this.group.rotation.setFromVector3(
          this.snapRotation(this.group.rotation.toVector3())
        );
        this.deselectLayer(this.flipLayer);

        // Вызов функции обратного вызова (callback) с сохраненным состоянием повернутого слоя
        callback(layer);
      },
    });
  }

  // Объявление функции bounceCube
  bounceCube() {
    // Инициализация переменной `fixDelta`
    let fixDelta = true;

    // Возврат анонимной функции с параметрами `progress`, `delta` и `rotation`
    return (progress, delta, rotation) => {
      // Если `progress` >= 1
      if (progress >= 1) {
        // Если `fixDelta` равен `true`
        if (fixDelta) {
          // Переопределение значения `delta`
          delta = (progress - 1) * rotation;
          // Установка значения `false` для переменной `fixDelta`
          fixDelta = false;
        }

        // Вращение объекта на оси `flipAxis` с углом `delta`
        this.game.cube.object.rotateOnAxis(this.flipAxis, delta);
      }
    };
  }

  rotateCube(rotation, callback) {
    // определяем параметры анимации в зависимости от конфигурации кубика
    const config = this.flipConfig;
    const easing = [Easing.Power.Out(4), Easing.Sine.Out(), Easing.Back.Out(2)][
      config
    ];
    const duration = [100, 150, 350][config];

    // создаем tween анимацию, которая обновляет позицию ребер кубика и вызывает callback по завершению
    this.rotationTween = new Tween({
      easing: easing,
      duration: duration,
      onUpdate: (tween) => {
        this.edges.rotateOnWorldAxis(this.flipAxis, tween.delta * rotation);
        this.game.cube.object.rotation.copy(this.edges.rotation);
      },
      onComplete: () => {
        // после завершения анимации, устанавливаем позицию ребер и вызываем callback
        this.edges.rotation.setFromVector3(
          this.snapRotation(this.edges.rotation.toVector3())
        );
        this.game.cube.object.rotation.copy(this.edges.rotation);
        callback();
      },
    });
  }

  selectLayer(layer) {
    // устанавливаем начальную позицию группы на 0
    this.group.rotation.set(0, 0, 0);
    // перемещаем куски кубика для выбранного слоя и добавляем их в группу
    this.movePieces(layer, this.game.cube.object, this.group);
    this.flipLayer = layer;
  }

  deselectLayer(layer) {
    // перемещаем куски кубика обратно на исходные позиции и удаляем их из группы
    this.movePieces(layer, this.group, this.game.cube.object);
    this.flipLayer = null;
  }

  movePieces(layer, from, to) {
    from.updateMatrixWorld(); // Обновляем матрицу мирового пространства для начального объекта
    to.updateMatrixWorld(); // Обновляем матрицу мирового пространства для конечного объекта

    // Проходим по каждому индексу элемента в массиве
    layer.forEach((index) => {
      // Получаем элемент по индексу
      const piece = this.game.cube.pieces[index];

      // Применяем матрицу мирового пространства к элементу из начального объекта
      piece.applyMatrix(from.matrixWorld);
      // Удаляем элемент из начального объекта
      from.remove(piece);
      // Применяем обратную матрицу мирового пространства к элементу
      piece.applyMatrix(new THREE.Matrix4().getInverse(to.matrixWorld));
      // Добавляем элемент в конечный объект
      to.add(piece);
    });
  }

  getLayer(position) {
    // Получаем множитель для определенного размера куба
    const scalar = { 2: 6, 3: 3, 4: 4, 5: 3 }[this.game.cube.size];
    // Создаем пустой массив
    const layer = [];

    let axis; // Объявляем переменную

    // Если позиция не задана
    if (position === false) {
      // Получаем родительский элемент объекта, который тянут
      const piece = this.dragIntersect.object.parent;

      axis = this.getMainAxis(this.flipAxis); // Получаем основную ось вращения
      position = piece.position.clone().multiplyScalar(scalar).round(); // Вычисляем позицию с учетом множителя

      // Если позиция задана
    } else {
      axis = this.getMainAxis(position); // Получаем основную ось вращения
    }

    // Перебираем все элементы в массиве cube.pieces
    this.game.cube.pieces.forEach((piece) => {
      // Создаем новый вектор, который является копией позиции данного элемента, умноженной на масштаб и округленной
      const piecePosition = piece.position
        .clone()
        .multiplyScalar(scalar)
        .round();

      // Если координата данного элемента по оси равна координате переданной позиции по той же оси, то добавляем название элемента в слой
      if (piecePosition[axis] == position[axis]) layer.push(piece.name);
    });

    // Возвращаем найденный слой
    return layer;
  }

  keyboardMove(type, move, callback) {
    // Если кубик уже вращается, выходим из функции
    if (this.state !== STILL) return;
    // Если вращение запрещено, выходим из функции
    if (this.enabled !== true) return;

    if (type === "LAYER") {
      // Находим слой, который нужно вращать
      const layer = this.getLayer(move.position);

      // Устанавливаем ось вращения
      this.flipAxis = new THREE.Vector3();
      this.flipAxis[move.axis] = 1;
      this.state = ROTATING;

      // Выделяем найденный слой на экране
      this.selectLayer(layer);
      // Вращаем слой на заданный угол
      this.rotateLayer(move.angle, false, (layer) => {
        // Сохраняем игру
        this.game.storage.saveGame();
        // Сбрасываем состояние
        this.state = STILL;
        // Проверяем, не решен ли кубик
        this.checkIsSolved();
      });
    } else if (type === "CUBE") {
      // Устанавливаем ось вращения
      this.flipAxis = new THREE.Vector3();
      this.flipAxis[move.axis] = 1;
      this.state = ROTATING;

      // Вращаем кубик на заданный угол
      this.rotateCube(move.angle, () => {
        // Сбрасываем состояние
        this.state = STILL;
      });
    }
  }

  // Функция для перемешивания кубика
  scrambleCube() {
    // Если перемешивание еще не задано, то задаем его и присваиваем функцию обратного вызова
    if (this.scramble == null) {
      this.scramble = this.game.scrambler;
      this.scramble.callback =
        typeof callback !== "function" ? () => {} : callback;
    }

    // Берем первый ход из массива перемешивания
    const converted = this.scramble.converted;
    const move = converted[0];
    // Получаем слой кубика, по которому будем вращать
    const layer = this.getLayer(move.position);

    // Задаем ось вращения
    this.flipAxis = new THREE.Vector3();
    this.flipAxis[move.axis] = 1;

    // Выбираем слой кубика и вращаем его
    this.selectLayer(layer);
    this.rotateLayer(move.angle, true, () => {
      // Удаляем первый ход из массива перемешивания
      converted.shift();

      // Если еще остались ходы, то продолжаем перемешивание
      if (converted.length > 0) {
        this.scrambleCube();
      } else {
        // Если больше нет ходов, то заканчиваем перемешивание и сохраняем игру
        this.scramble = null;
        this.game.storage.saveGame();
      }
    });
  }

  // Функция для получения пересечения объекта и луча, проходящего через позицию мыши
  getIntersect(position, object, multiple) {
    // Создаем луч, исходящий из позиции мыши, используя raycaster
    this.raycaster.setFromCamera(
      this.draggable.convertPosition(position.clone()),
      this.game.world.camera
    );

    // Получаем объекты, с которыми луч пересекается
    const intersect = multiple
      ? this.raycaster.intersectObjects(object)
      : this.raycaster.intersectObject(object);

    // Возвращаем первое пересечение
    return intersect.length > 0 ? intersect[0] : false;
  }

  // Функция для получения основной оси, основываясь на векторе
  getMainAxis(vector) {
    // Находим основную ось, сравнивая значения координат вектора
    return Object.keys(vector).reduce((a, b) =>
      Math.abs(vector[a]) > Math.abs(vector[b]) ? a : b
    );
  }

  // Функция для открепления объекта от родительского объекта
  detach(child, parent) {
    // Перемещаем объект в мировую систему координат
    child.applyMatrix(parent.matrixWorld);
    // Удаляем объект из родительского объекта
    parent.remove(child);
    // Добавляем объект в главную сцену игры
    this.game.world.scene.add(child);
  }

  // Функция для присоединения дочернего объекта к родительскому
  attach(child, parent) {
    // Применяем матрицу к дочернему объекту
    child.applyMatrix(new THREE.Matrix4().getInverse(parent.matrixWorld));
    // Удаляем дочерний объект из сцены
    this.game.world.scene.remove(child);
    // Добавляем дочерний объект к родительскому объекту
    parent.add(child);
  }

  // Функция для добавления точки импульса
  addMomentumPoint(delta) {
    const time = Date.now(); // Получаем текущее время

    // Фильтруем список импульсов, чтобы удалить те, которые были добавлены более 500 миллисекунд назад
    this.momentum = this.momentum.filter((moment) => time - moment.time < 500);

    // Если входной параметр delta не равен false, добавляем новый импульс
    if (delta !== false) this.momentum.push({ delta, time });
  }

  // Функция для получения среднего импульса из добавленных точек
  getMomentum() {
    const points = this.momentum.length; // Получаем количество добавленных точек
    const momentum = new THREE.Vector2(); // Создаем вектор импульса

    this.addMomentumPoint(false); // Добавляем фиктивную точку, чтобы учесть текущее положение

    // Итерируем по всем добавленным точкам
    this.momentum.forEach((point, index) => {
      // Добавляем импульс текущей точки к общему импульсу
      momentum.add(point.delta.multiplyScalar(index / points));
    });

    return momentum; // Возвращаем средний импульс
  }

  // Определяем функцию "roundAngle", которая принимает угол в радианах и округляет его до ближайшего угла, кратного 90 градусов
  roundAngle(angle) {
    const round = Math.PI / 2;
    return Math.sign(angle) * Math.round(Math.abs(angle) / round) * round;
  }

  // Определяем функцию "snapRotation", которая округляет углы объекта (углы поворота) до ближайших углов, кратных 90 градусов
  snapRotation(angle) {
    return angle.set(
      this.roundAngle(angle.x),
      this.roundAngle(angle.y),
      this.roundAngle(angle.z)
    );
  }

  // Функция для проверки, решена ли головоломка
  checkIsSolved() {
    // Запоминаем время начала выполнения функции
    const start = performance.now();

    // Флаг, указывающий, решена ли головоломка
    let solved = true;
    // Объект, содержащий массивы ребер для каждой стороны кубика
    const sides = {
      "x-": [],
      "x+": [],
      "y-": [],
      "y+": [],
      "z-": [],
      "z+": [],
    };

    // Для каждого ребра на кубике
    this.game.cube.edges.forEach((edge) => {
      // Вычисляем позицию ребра в мировых координатах и переводим ее в локальные координаты кубика
      const position = edge.parent
        .localToWorld(edge.position.clone())
        .sub(this.game.cube.object.position);

      // Определяем главную ось, вдоль которой расположено ребро, и ее знак
      const mainAxis = this.getMainAxis(position);
      const mainSign =
        position.multiplyScalar(2).round()[mainAxis] < 1 ? "-" : "+";

      // Добавляем имя ребра в соответствующий массив
      sides[mainAxis + mainSign].push(edge.name);
    });

    // Проверяем, что все ребра на каждой стороне имеют одинаковое имя
    Object.keys(sides).forEach((side) => {
      if (!sides[side].every((value) => value === sides[side][0]))
        solved = false;
    });

    // Если флаг solved равен true, вызываем обработчик на решение головоломки
    if (solved) this.onSolved();
  }
}

class Scrambler {
  // Конструктор класса с переданным параметром game
  constructor(game) {
    // Инициализация свойств game, difficulty, moves, converted и pring
    this.game = game;

    this.dificulty = 0;

    // Определение длины перемешивания для разных уровней сложности в соответствии с размером кубика
    this.scrambleLength = {
      2: [7, 9, 11],
      3: [20, 25, 30],
      4: [30, 40, 50],
      5: [40, 60, 80],
    };

    this.moves = [];
    this.conveted = [];
    this.pring = "";
  }

  // Функция scramble, которая принимает аргумент scramble
  scramble(scramble) {
    // Объявление переменной count и инициализация ее значением 0
    let count = 0;
    // Установка значения переменной moves: если аргумент scramble не undefined, то разбиение на подстроки по пробелам и сохранение их в массив
    // В противном случае moves инициализируется пустым массивом
    this.moves = typeof scramble !== "undefined" ? scramble.split(" ") : [];

    // Если длина массива moves меньше 1
    if (this.moves.length < 1) {
      // Выбор длины перемешивания в зависимости от размера кубика и сложности (данная переменная не определена)
      const scrambleLength =
        this.scrambleLength[this.game.cube.size][this.dificulty];

      // Задание строк, представляющих грани кубика в зависимости от его размера
      const faces = this.game.cube.size < 4 ? "UDLRFB" : "UuDdLlRrFfBb";
      // Массив из 3-х строковых значений, представляющих разные модификаторы движения
      const modifiers = ["", "'", "2"];
      // Определение общей длины перемешивания: если аргумент не задан, то берется scrambleLength, иначе используется значение аргумента
      const total = typeof scramble === "undefined" ? scrambleLength : scramble;

      // Цикл, который создает перемешивание
      while (count < total) {
        // Выбор случайной грани и модификатора движения
        const move =
          faces[Math.floor(Math.random() * faces.length)] +
          modifiers[Math.floor(Math.random() * 3)];

        // Если текущее движение и предыдущее движение имеют одну и ту же грань, пропустить текущее движение
        if (count > 0 && move.charAt(0) == this.moves[count - 1].charAt(0))
          continue;
        // Если текущее движение и два предыдущих движения имеют одну и ту же грань, пропустить текущее движение
        if (count > 1 && move.charAt(0) == this.moves[count - 2].charAt(0))
          continue;

        // Добавить текущее движение в массив moves и увеличить значение count
        this.moves.push(move);
        count++;
      }
    }

    // Определение пустой функции callback
    this.callback = () => {};
    // Преобразование движений в формат, который понимает игра и сохранение в переменную print
    this.convert();
    this.print = this.moves.join(" ");

    // Возврат текущего объекта
    return this;
  }

  // Начало определения функции "convert", которая принимает один аргумент "moves"
  convert(moves) {
    // Создание пустого массива "converted"
    this.converted = [];

    // Итерация по всем элементам массива "moves"
    this.moves.forEach((move) => {
      // Вызов функции "convertMove" для каждого элемента массива "moves"
      const convertedMove = this.convertMove(move);
      // Получение модификатора хода
      const modifier = move.charAt(1);

      // Добавление сконвертированного хода в массив "converted"
      this.converted.push(convertedMove);
      // Добавление сконвертированного хода еще раз, если у хода есть модификатор "2"
      if (modifier == "2") this.converted.push(convertedMove);
    });
  }

  // Определение функции "convertMove", которая принимает один аргумент "move"
  convertMove(move) {
    // Получение обозначения грани
    const face = move.charAt(0);
    // Получение модификатора хода
    const modifier = move.charAt(1);

    // Определение оси вращения в зависимости от обозначения грани
    const axis = { D: "y", U: "y", L: "x", R: "x", F: "z", B: "z" }[
      face.toUpperCase()
    ];
    // Определение строки, на которую будет поворачиваться грань, в зависимости от обозначения грани
    let row = { D: -1, U: 1, L: -1, R: 1, F: 1, B: -1 }[face.toUpperCase()];

    // Если размер куба больше 3 и обозначение грани в верхнем регистре, удвоить строку
    if (this.game.cube.size > 3 && face !== face.toLowerCase()) row = row * 2;

    // Создание вектора для хранения позиции грани
    const position = new THREE.Vector3();
    // Установка координаты вектора, соответствующей оси вращения, равной строке, на которую поворачивается грань
    position[
      { D: "y", U: "y", L: "x", R: "x", F: "z", B: "z" }[face.toUpperCase()]
    ] = row;

    // Вычисление угла поворота в радианах
    const angle = (Math.PI / 2) * -row * (modifier == "'" ? -1 : 1);

    // Возврат объекта с полями "position", "axis", "angle" и "name"
    return { position, axis, angle, name: move };
  }
}

class Transition {
  constructor(game) {
    // Конструктор класса, который принимает объект игры

    this.game = game; // Присвоение объекта игры

    this.tweens = {}; // Создание объекта анимации
    this.durations = {}; // Создание объекта длительности анимации
    this.data = {
      // Создание объекта с данными для анимации
      cubeY: -0.2, // Координата по оси Y для перемещения куба
      cameraZoom: 0.85, // Значение увеличения камеры
    };

    this.activeTransitions = 0; // Установка количества активных анимаций на 0
  }

  init() {
    // Метод инициализации анимации

    this.game.controls.disable(); // Отключение управления

    this.game.cube.object.position.y = this.data.cubeY; // Установка координаты Y для куба
    this.game.cube.animator.position.y = 4; // Установка координаты Y для анимации куба
    this.game.cube.animator.rotation.x = -Math.PI / 3; // Установка угла поворота анимации куба
    this.game.world.camera.zoom = this.data.cameraZoom; // Установка увеличения камеры
    this.game.world.camera.updateProjectionMatrix(); // Обновление матрицы проекции камеры

    this.tweens.buttons = {}; // Создание объекта анимации для кнопок
    this.tweens.timer = []; // Создание массива анимации для таймера
    this.tweens.title = []; // Создание массива анимации для заголовка
    this.tweens.best = []; // Создание массива анимации для лучшего времени
    this.tweens.complete = []; // Создание массива анимации для сообщения о завершении
    this.tweens.prefs = []; // Создание массива анимации для настроек
    this.tweens.stats = []; // Создание массива анимации для статистики
  }

  // Определение функции buttons с двумя параметрами show и hide
  buttons(show, hide) {
    // Определение функции buttonTween с параметрами button и show
    const buttonTween = (button, show) => {
      // Создание нового Tween
      return new Tween({
        target: button.style, // Назначение анимации свойства стиля элемента button
        duration: 300, // Длительность анимации в миллисекундах
        easing: show ? Easing.Power.Out(2) : Easing.Power.In(3), // Тип эффекта анимации
        from: { opacity: show ? 0 : 1 }, // Начальное значение свойства opacity
        to: { opacity: show ? 1 : 0 }, // Конечное значение свойства opacity
        onUpdate: (tween) => {
          // Функция, которая вызывается при каждом обновлении анимации

          // Расчет значения translate
          const translate = show ? 1 - tween.value : tween.value;
          // Применение трансформации translate3d к свойству transform элемента button
          button.style.transform = `translate3d(0, ${translate * 1.5}em, 0)`;
        },
        onComplete: () => (button.style.pointerEvents = show ? "all" : "none"), // Функция, которая вызывается при завершении анимации
      });
    };

    // Для каждой кнопки в массиве hide добавляем анимацию скрытия
    hide.forEach(
      (button) =>
        (this.tweens.buttons[button] = buttonTween(
          this.game.dom.buttons[button],
          false
        ))
    );

    // Задержка выполнения функции добавления анимации появления для каждой кнопки в массиве show
    setTimeout(
      () =>
        show.forEach((button) => {
          this.tweens.buttons[button] = buttonTween(
            this.game.dom.buttons[button],
            true
          );
        }),
      hide ? 500 : 0
    );
  }

  // Начало функции "cube" с параметрами "show" и "theming", по умолчанию "theming" равен "false"
  cube(show, theming = false) {
    // Увеличиваем счетчик активных анимаций
    this.activeTransitions++;

    // Останавливаем текущее вращение куба и сохраняем его текущее положение
    try {
      this.tweens.cube.stop();
    } catch (e) {}
    const currentY = this.game.cube.animator.position.y;
    const currentRotation = this.game.cube.animator.rotation.x;

    // Создаем новую анимацию Tween
    this.tweens.cube = new Tween({
      duration: show ? 3000 : 1250, // Задаем продолжительность анимации в зависимости от значения "show"
      easing: show ? Easing.Elastic.Out(0.8, 0.6) : Easing.Back.In(1), // Задаем функцию для плавности анимации
      onUpdate: (tween) => {
        // Каждый раз при обновлении анимации, выполняем следующее:

        // Изменяем положение куба в зависимости от значения "show" и "theming"
        this.game.cube.animator.position.y = show
          ? theming
            ? 0.9 + (1 - tween.value) * 3.5
            : (1 - tween.value) * 4
          : currentY + tween.value * 4;

        // Изменяем вращение куба в зависимости от значения "show" и сохраненного текущего положения
        this.game.cube.animator.rotation.x = show
          ? ((1 - tween.value) * Math.PI) / 3
          : currentRotation + (tween.value * -Math.PI) / 3;
      },
    });

    // Если передано значение "theming", то выполняем следующее:
    if (theming) {
      // Если значение "show" равно "true", то изменяем зум камеры и обновляем матрицу проекции
      if (show) {
        this.game.world.camera.zoom = 0.75;
        this.game.world.camera.updateProjectionMatrix();
      } else {
        // Если значение "show" равно "false", то выполняем следующее:

        // Задержка в 1.5 секунды перед возвратом к начальному зуму камеры
        setTimeout(() => {
          this.game.world.camera.zoom = this.data.cameraZoom;
          this.game.world.camera.updateProjectionMatrix();
        }, 1500);
      }
    }

    // Задаем длительность анимации куба
    this.durations.cube = show ? 1500 : 1500;

    // Запускаем таймер, который уменьшает количество активных переходов на 1, после завершения анимации куба
    setTimeout(() => this.activeTransitions--, this.durations.cube);
  }

  float() {
    // Остановка предыдущей анимации float, если она есть
    try {
      this.tweens.float.stop();
    } catch (e) {}
    // Создание новой анимации float с параметрами
    this.tweens.float = new Tween({
      // Длительность анимации - 1500 мсек
      duration: 1500,
      // Использовать функцию сглаживания Sine.InOut
      easing: Easing.Sine.InOut(),
      // Анимация в обе стороны (вперед и назад)
      yoyo: true,
      // Функция, вызываемая при каждом обновлении анимации
      onUpdate: (tween) => {
        // Изменение позиции, поворота и координаты краёв объекта
        this.game.cube.holder.position.y = -0.02 + tween.value * 0.04;
        this.game.cube.holder.rotation.x = 0.005 - tween.value * 0.01;
        this.game.cube.holder.rotation.z = -this.game.cube.holder.rotation.x;
        this.game.cube.holder.rotation.y = this.game.cube.holder.rotation.x;

        this.game.controls.edges.position.y =
          this.game.cube.holder.position.y + this.game.cube.object.position.y;
      },
    });
  }

  // Начало объявления метода класса:
  zoom(play, time) {
    // Увеличиваем количество активных переходов
    this.activeTransitions++;

    // Устанавливаем переменную zoom в 1, если play true, иначе используем значение this.data.cameraZoom
    const zoom = play ? 1 : this.data.cameraZoom;
    // Устанавливаем длительность анимации, если time > 0, иначе устанавливаем длительность в 1500 мс
    const duration = time > 0 ? Math.max(time, 1500) : 1500;
    // Вычисляем количество вращений куба в зависимости от длительности
    const rotations = time > 0 ? Math.round(duration / 1500) : 1;
    // Устанавливаем функцию эффекта для анимации
    const easing = Easing.Power.InOut(time > 0 ? 2 : 3);

    // Создаем новый tween для анимации увеличения/уменьшения масштаба камеры
    this.tweens.zoom = new Tween({
      target: this.game.world.camera, // устанавливаем цель анимации
      duration: duration, // устанавливаем длительность
      easing: easing, // устанавливаем функцию эффекта
      to: { zoom: zoom }, // устанавливаем значение свойства, которое будет анимироваться
      onUpdate: () => {
        this.game.world.camera.updateProjectionMatrix();
      }, // обновляем матрицу проекции камеры при изменении zoom
    });

    // Создаем новый tween для анимации вращения куба
    this.tweens.rotate = new Tween({
      target: this.game.cube.animator.rotation, // устанавливаем цель анимации
      duration: duration, // устанавливаем длительность
      easing: easing, // устанавливаем функцию эффекта
      to: { y: -Math.PI * 2 * rotations }, // устанавливаем значение свойства, которое будет анимироваться
      onComplete: () => {
        this.game.cube.animator.rotation.y = 0;
      }, // устанавливаем значение свойства, когда анимация завершена
    });

    // Устанавливаем длительность анимации увеличения/уменьшения масштаба камеры
    this.durations.zoom = duration;

    // Задержка до уменьшения количества активных переходов на 1
    setTimeout(() => this.activeTransitions--, this.durations.zoom);
  }

  // Функция увеличения высоты куба с анимацией
  elevate(complete) {
    // Увеличиваем число активных переходов
    this.activeTransitions++;

    // Вычисляем новую координату куба по оси Y
    const cubeY =
      // Создаем анимацию перемещения куба
      (this.tweens.elevate = new Tween({
        target: this.game.cube.object.position, // Объект, который будет анимироваться
        duration: complete ? 1500 : 0, // Длительность анимации
        easing: Easing.Power.InOut(3), // Функция изменения скорости анимации
        to: { y: complete ? -0.05 : this.data.cubeY }, // Новая координата по оси Y
      }));

    this.durations.elevate = 1500; // Сохраняем длительность анимации

    // Завершаем анимацию через указанное время
    setTimeout(() => this.activeTransitions--, this.durations.elevate);
  }

  // Функция complete срабатывает при завершении игры или достижении нового рекорда
  complete(show, best) {
    this.activeTransitions++; // Увеличиваем счетчик активных переходов

    // Выбираем элемент текста, в котором нужно заменить буквы на иконки и делаем это, если еще не сделали
    const text = best ? this.game.dom.texts.best : this.game.dom.texts.complete;

    if (text.querySelector("span i") === null)
      text.querySelectorAll("span").forEach((span) => this.splitLetters(span));

    // Находим все элементы букв и иконок в тексте и запускаем анимацию "переворота" их значений
    const letters = text.querySelectorAll(".icon, i");

    this.flipLetters(best ? "best" : "complete", letters, show);

    // Делаем текст непрозрачным
    text.style.opacity = 1;

    // Задаем длительность анимации
    const duration = this.durations[best ? "best" : "complete"];

    // Если аргумент show = false (то есть это завершение игры, а не установка нового рекорда), убираем анимацию таймера через заданное время
    if (!show)
      setTimeout(
        () => (this.game.dom.texts.timer.style.transform = ""),
        duration
      );

    // Задержка перед уменьшением счетчика активных переходов
    setTimeout(() => this.activeTransitions--, duration);
  }

  stats(show) {
    // Если параметр "show" равен true, то вызываем метод "calcStats" объекта "this.game.scores"
    if (show) this.game.scores.calcStats();

    // Увеличиваем значение переменной "activeTransitions" на 1
    this.activeTransitions++;

    // Останавливаем все анимации "tweens.stats" и удаляем их
    this.tweens.stats.forEach((tween) => {
      tween.stop();
      tween = null;
    });

    // Идентификатор анимации равен -1
    let tweenId = -1;

    // Выбираем все элементы с классом "stats" в "game.dom.stats" и применяем к ним функцию обратного вызова
    const stats = this.game.dom.stats.querySelectorAll(".stats");
    // Определяем функцию эффекта "easing" в зависимости от значения "show"
    const easing = show ? Easing.Power.Out(2) : Easing.Power.In(3);

    // Проходимся по всем элементам "stats" и применяем к ним анимации
    stats.forEach((stat, index) => {
      const delay = index * (show ? 80 : 60); // Задержка равна умножению индекса на 80 или 60, в зависимости от значения "show"

      // Создаем новую анимацию и добавляем ее в массив "tweens.stats"
      this.tweens.stats[tweenId++] = new Tween({
        delay: delay, // Задержка анимации
        duration: 400, // Продолжительность анимации
        easing: easing, // Функция эффекта
        onUpdate: (tween) => {
          // Рассчитываем значения анимации в зависимости от значения "show"
          const translate = show ? (1 - tween.value) * 2 : tween.value;
          const opacity = show ? tween.value : 1 - tween.value;

          // Применяем значения анимации к стилю элемента
          stat.style.transform = `translate3d(0, ${translate}em, 0)`;
          stat.style.opacity = opacity;
        },
      });
    });

    // Задаем значение "durations.stats" равное 0
    this.durations.stats = 0;

    // Устанавливаем таймаут на выполнение функции обратного вызова после задержки
    setTimeout(() => this.activeTransitions--, this.durations.stats);
  }

  // Метод для управления отображением настроек
  preferences(show) {
    // Выбираем все элементы с классом 'range' из блока с настройками игры и передаем их в метод ranges
    this.ranges(this.game.dom.prefs.querySelectorAll(".range"), "prefs", show);
  }

  ranges(ranges, type, show) {
    // Увеличиваем счётчик активных переходов на единицу
    this.activeTransitions++;

    // Прерываем все предыдущие анимации, соответствующие переданному типу
    this.tweens[type].forEach((tween) => {
      tween.stop();
      tween = null;
    });

    // Определяем параметр easing, зависящий от переданного значения show
    const easing = show ? Easing.Power.Out(2) : Easing.Power.In(3);

    // Инициализируем переменные tweenId и listMax со значениями -1 и 0 соответственно
    let tweenId = -1;
    let listMax = 0;

    // Обрабатываем каждый элемент массива ranges, переданный в функцию
    ranges.forEach((range, rangeIndex) => {
      // Инициализируем переменные label, track, handle и list значениями элементов с соответствующими селекторами
      const label = range.querySelector(".range__label");
      const track = range.querySelector(".range__track-line");
      const handle = range.querySelector(".range__handle");
      const list = range.querySelectorAll(".range__list div");

      // Определяем значение параметра delay, зависящее от значения rangeIndex и show
      const delay = rangeIndex * (show ? 120 : 100);

      // Задаем значения свойств элементов label, track и handle в зависимости от значения show
      label.style.opacity = show ? 0 : 1;
      track.style.opacity = show ? 0 : 1;
      handle.style.opacity = show ? 0 : 1;
      handle.style.pointerEvents = show ? "all" : "none";

      // Создаем анимацию для элемента label, используя объект класса Tween из библиотеки Tween.js
      this.tweens[type][tweenId++] = new Tween({
        delay: show ? delay : delay,
        duration: 400,
        easing: easing,
        onUpdate: (tween) => {
          // Определяем значение параметра translate, зависящего от значения show и текущего значения tween.value
          const translate = show ? 1 - tween.value : tween.value;
          // Определяем значение параметра opacity, зависящего от значения show и текущего значения tween.value
          const opacity = show ? tween.value : 1 - tween.value;

          // Изменяем свойства элемента label в соответствии с определенными значениями параметров translate и opacity
          label.style.transform = `translate3d(0, ${translate}em, 0)`;
          label.style.opacity = opacity;
        },
      });

      // Создание объектов анимаций Tween для перемещения трека и ручки слайдера
      this.tweens[type][tweenId++] = new Tween({
        // Задержка перед началом анимации
        delay: show ? delay + 100 : delay,
        // Продолжительность анимации
        duration: 400,
        // Функция плавности анимации
        easing: easing,
        // Функция, которая будет вызвана при каждом обновлении анимации
        onUpdate: (tween) => {
          // Получение значений анимации
          const translate = show ? 1 - tween.value : tween.value;
          const scale = show ? tween.value : 1 - tween.value;
          const opacity = scale;

          // Установка значений стилей для перемещения трека
          track.style.transform = `translate3d(0, ${translate}em, 0) scale3d(${scale}, 1, 1)`;
          track.style.opacity = opacity;
        },
      });

      this.tweens[type][tweenId++] = new Tween({
        // Задержка перед началом анимации
        delay: show ? delay + 100 : delay,
        // Продолжительность анимации
        duration: 400,
        // Функция плавности анимации
        easing: easing,
        // Функция, которая будет вызвана при каждом обновлении анимации
        onUpdate: (tween) => {
          // Получение значений анимации
          const translate = show ? 1 - tween.value : tween.value;
          const opacity = 1 - translate;
          const scale = 0.5 + opacity * 0.5;

          // Установка значений стилей для перемещения ручки
          handle.style.transform = `translate3d(0, ${translate}em, 0) scale3d(${scale}, ${scale}, ${scale})`;
          handle.style.opacity = opacity;
        },
      });

      // Перебираем каждый элемент массива list с помощью forEach
      list.forEach((listItem, labelIndex) => {
        // Устанавливаем значение непрозрачности элемента в зависимости от условия
        listItem.style.opacity = show ? 0 : 1;

        // Добавляем новый объект анимации в массив tweens
        this.tweens[type][tweenId++] = new Tween({
          // Устанавливаем задержку в зависимости от условия
          delay: show ? delay + 200 + labelIndex * 50 : delay,
          // Устанавливаем длительность анимации
          duration: 400,
          // Функция плавности анимации
          easing: easing,
          // Функция, которая будет вызвана при каждом обновлении анимации
          onUpdate: (tween) => {
            // Вычисляем значение смещения и непрозрачности в зависимости от условия
            const translate = show ? 1 - tween.value : tween.value;
            const opacity = show ? tween.value : 1 - tween.value;

            // Устанавливаем стиль transform элемента в зависимости от смещения
            listItem.style.transform = `translate3d(0, ${translate}em, 0)`;
            // Устанавливаем значение непрозрачности элемента в зависимости от непрозрачности
            listItem.style.opacity = opacity;
          },
        });
      });

      // Вычисляем максимальную длину массива list и сохраняем её в переменную listMax
      listMax = list.length > listMax ? list.length - 1 : listMax;

      // Устанавливаем значение непрозрачности элемента range в 1
      range.style.opacity = 1;
    });

    // Устанавливаем значение длительности анимации в зависимости от условия
    this.durations[type] = show
      ? (ranges.length - 1) * 100 + 200 + listMax * 50 + 400
      : (ranges.length - 1) * 100 + 400;

    // Устанавливаем таймер, который уменьшает значение переменной activeTransitions через определённое время
    setTimeout(() => this.activeTransitions--, this.durations[type]);
  }

  title(show) {
    // Увеличиваем количество активных анимаций на 1
    this.activeTransitions++;

    // Получаем элемент заголовка
    const title = this.game.dom.texts.title;

    // Если в заголовке нет тегов <span> с классом <i>, разбиваем текст на буквы
    if (title.querySelector("span i") === null)
      title.querySelectorAll("span").forEach((span) => this.splitLetters(span));

    // Получаем все элементы <i> в заголовке
    const letters = title.querySelectorAll("i");

    // Производим анимацию "flip" для букв в заголовке
    this.flipLetters("title", letters, show);

    // Устанавливаем непрозрачность заголовка равной 1
    title.style.opacity = 1;

    // Получаем элемент заметки
    const note = this.game.dom.texts.note;

    // Создаем Tween анимацию для заметки, которая меняет ее непрозрачность
    this.tweens.title[letters.length] = new Tween({
      target: note.style,
      easing: Easing.Sine.InOut(),
      duration: show ? 800 : 400,
      yoyo: show ? true : null,
      from: { opacity: show ? 0 : parseFloat(getComputedStyle(note).opacity) },
      to: { opacity: show ? 1 : 0 },
    });

    // Устанавливаем таймер, который уменьшает количество активных анимаций через некоторое время
    setTimeout(() => this.activeTransitions--, this.durations.title);
  }

  // Определяем функцию timer, которая принимает в качестве аргумента show
  timer(show) {
    // Увеличиваем значение переменной activeTransitions на 1
    this.activeTransitions++;

    // Получаем доступ к элементу таймера
    const timer = this.game.dom.texts.timer;

    // Устанавливаем прозрачность элемента таймера в 0
    timer.style.opacity = 0;
    // Конвертируем время и устанавливаем его в элемент таймера
    this.game.timer.convert();
    this.game.timer.setText();

    // Разбиваем текст элемента таймера на отдельные буквы и оборачиваем их в тег <i>
    this.splitLetters(timer);
    // Получаем список элементов <i>, содержащих отдельные буквы
    const letters = timer.querySelectorAll("i");
    // Анимируем каждую букву, вызывая функцию flipLetters
    this.flipLetters("timer", letters, show);

    // Устанавливаем прозрачность элемента таймера в 1
    timer.style.opacity = 1;

    // Запускаем таймер на отмену анимации и уменьшаем значение переменной activeTransitions на 1 после окончания таймера
    setTimeout(() => this.activeTransitions--, this.durations.timer);
  }

  // Определяем функцию splitLetters, которая разбивает текст элемента на отдельные буквы и оборачивает их в тег <i>
  splitLetters(element) {
    // Получаем текст элемента
    const text = element.innerHTML;

    // Устанавливаем внутреннее содержимое элемента в пустую строку
    element.innerHTML = "";

    // Проходим по каждой букве в тексте элемента
    text.split("").forEach((letter) => {
      // Создаем элемент <i> и устанавливаем его содержимое в текущую букву
      const i = document.createElement("i");

      i.innerHTML = letter;

      // Добавляем элемент <i> в родительский элемент
      element.appendChild(i);
    });
  }

  flipLetters(type, letters, show) {
    // Остановка всех существующих анимаций типа type
    try {
      this.tweens[type].forEach((tween) => tween.stop());
    } catch (e) {}
    // Для каждой буквы из letters
    letters.forEach((letter, index) => {
      // Если show равен true, устанавливаем нулевую прозрачность буквы, иначе максимальную прозрачность
      letter.style.opacity = show ? 0 : 1;

      // Создание новой анимации типа type для буквы
      this.tweens[type][index] = new Tween({
        // Функция сглаживания анимации
        easing: Easing.Sine.Out(),
        // Длительность анимации
        duration: show ? 800 : 400,
        // Задержка перед началом анимации
        delay: index * 50,
        // Функция, вызываемая на каждом кадре анимации
        onUpdate: (tween) => {
          // Вычисление угла поворота буквы в зависимости от значения tween
          const rotation = show ? (1 - tween.value) * -80 : tween.value * 80;

          // Установка CSS свойства transform для поворота буквы
          letter.style.transform = `rotate3d(0, 1, 0, ${rotation}deg)`;
          // Установка прозрачности буквы
          letter.style.opacity = show ? tween.value : 1 - tween.value;
        },
      });
    });

    // Вычисление общей длительности анимации типа type
    this.durations[type] = (letters.length - 1) * 50 + (show ? 800 : 400);
  }
}

// Определение класса Timer, который наследуется от класса Animation
class Timer extends Animation {
  // Конструктор класса, принимающий экземпляр игры в качестве аргумента
  constructor(game) {
    // Вызов конструктора родительского класса Animation
    super(false);

    // Установка свойства game в экземпляр игры
    this.game = game;
    // Вызов метода reset для установки свойств объекта
    this.reset();
  }

  // Метод для запуска таймера
  start(continueGame) {
    // Если continueGame не указан, то startTime устанавливается в текущее время
    // Если continueGame указан, то startTime высчитывается путем вычитания дельты времени из текущего времени
    this.startTime = continueGame ? Date.now() - this.deltaTime : Date.now();
    this.deltaTime = 0;
    // Вызов метода convert для перевода времени в нужный формат
    this.converted = this.convert();

    // Вызов метода start у родительского класса
    super.start();
  }

  // Метод для сброса таймера
  reset() {
    // Установка свойств объекта в исходные значения
    this.startTime = 0;
    this.currentTime = 0;
    this.deltaTime = 0;
    this.converted = "0:00";
  }

  // Метод для остановки таймера
  stop() {
    // Установка свойства currentTime в текущее время
    this.currentTime = Date.now();
    // Расчет дельты времени
    this.deltaTime = this.currentTime - this.startTime;
    // Вызов метода convert для перевода времени в нужный формат
    this.convert();

    // Вызов метода stop у родительского класса
    super.stop();

    // Возврат объекта с временем в нужном формате и дельтой времени в миллисекундах
    return { time: this.converted, millis: this.deltaTime };
  }

  // Функция для обновления таймера
  update() {
    // Сохраняем текущее значение времени
    const old = this.converted;

    // Получаем текущее время и вычисляем разницу между начальным временем и текущим
    this.currentTime = Date.now();
    this.deltaTime = this.currentTime - this.startTime;
    // Вызываем функцию конвертации времени
    this.convert();

    // Если значение изменилось, обновляем локальное хранилище и текстовый элемент на странице
    if (this.converted != old) {
      localStorage.setItem("theCube_time", this.deltaTime);
      this.setText();
    }
  }

  // Функция конвертации времени в формат минуты:секунды
  convert() {
    // Получаем количество секунд и минут
    const seconds = parseInt((this.deltaTime / 1000) % 60);
    const minutes = parseInt(this.deltaTime / (1000 * 60));

    // Записываем сконвертированное время
    this.converted = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }

  // Функция обновления текстового элемента на странице
  setText() {
    this.game.dom.texts.timer.innerHTML = this.converted;
  }
}

// Объявление константы RangeHTML
const RangeHTML = [
  '<div class="range">', // Открывающий тег div с классом range
  '<div class="range__label"></div>', // Дочерний div-элемент с классом range__label
  '<div class="range__track">', // Дочерний div-элемент с классом range__track
  '<div class="range__track-line"></div>', // Дочерний div-элемент с классом range__track-line
  '<div class="range__handle"><div></div></div>', // Дочерний div-элемент с классом range__handle и вложенным div-элементом
  "</div>",
  '<div class="range__list"></div>', // Дочерний div-элемент с классом range__list
  "</div>",
].join("\n");

// Получаем все элементы с тегом 'range' и запускаем forEach
document.querySelectorAll("range").forEach((el) => {
  // Создаем временный элемент div и добавляем в него HTML код для создания элемента range
  const temp = document.createElement("div");
  temp.innerHTML = RangeHTML;

  // Находим элементы в созданном HTML
  const range = temp.querySelector(".range");
  const rangeLabel = range.querySelector(".range__label");
  const rangeList = range.querySelector(".range__list");

  // Добавляем атрибут 'name' со значением, взятым из соответствующего элемента 'el'
  range.setAttribute("name", el.getAttribute("name"));
  // Устанавливаем в 'rangeLabel' значение атрибута 'title' элемента 'el'
  rangeLabel.innerHTML = el.getAttribute("title");

  // Если у элемента 'el' есть атрибут 'color', добавляем соответствующие классы
  if (el.hasAttribute("color")) {
    range.classList.add("range--type-color");
    range.classList.add("range--color-" + el.getAttribute("name"));
  }

  // Если у элемента 'el' есть атрибут 'list', разбиваем его содержимое по запятой
  // и создаем для каждого элемента новый div, добавляя его в список rangeList
  if (el.hasAttribute("list")) {
    el.getAttribute("list")
      .split(",")
      .forEach((listItemText) => {
        const listItem = document.createElement("div");
        listItem.innerHTML = listItemText;
        rangeList.appendChild(listItem);
      });
  }

  // Заменяем элемент 'el' на созданный элемент 'range'
  el.parentNode.replaceChild(range, el);
});

class Range {
  constructor(name, options) {
    // Присваивание значения по умолчанию для необязательных параметров options
    options = Object.assign(
      {
        range: [0, 1],
        value: 0,
        step: 0,
        onUpdate: () => {},
        onComplete: () => {},
      },
      options || {}
    );

    // Нахождение элементов и присвоение их переменным
    this.element = document.querySelector('.range[name="' + name + '"]');
    this.track = this.element.querySelector(".range__track");
    this.handle = this.element.querySelector(".range__handle");
    this.list = [].slice.call(
      this.element.querySelectorAll(".range__list div")
    );

    // Присваивание начального значения переменных
    this.value = options.value;
    this.min = options.range[0];
    this.max = options.range[1];
    this.step = options.step;

    // Присваивание методов
    this.onUpdate = options.onUpdate;
    this.onComplete = options.onComplete;

    // Установка значения value
    this.setValue(this.value);

    // Инициализация drag and drop
    this.initDraggable();
  }

  // Метод для установки значения value
  setValue(value) {
    // Задание нового значения value с учетом ограничений и округления
    this.value = this.round(this.limitValue(value));
    // Перемещение позиции handle
    this.setHandlePosition();
  }

  initDraggable() {
    let current; // Инициализируем переменную current

    // Создаем объект Draggable и сохраняем его в this.draggable, также задаем свойство calcDelta: true
    this.draggable = new Draggable(this.handle, { calcDelta: true });

    // Устанавливаем обработчик onDragStart
    this.draggable.onDragStart = (position) => {
      current = this.positionFromValue(this.value); // Сохраняем текущую позицию в current
      this.handle.style.left = current + "px"; // Устанавливаем позицию элемента
    };

    // Устанавливаем обработчик onDragMove
    this.draggable.onDragMove = (position) => {
      current = this.limitPosition(current + position.delta.x); // Ограничиваем позицию
      this.value = this.round(this.valueFromPosition(current)); // Получаем значение
      this.setHandlePosition(); // Устанавливаем позицию элемента

      this.onUpdate(this.value); // Вызываем обработчик события onUpdate
    };

    // Устанавливаем обработчик onDragEnd
    this.draggable.onDragEnd = (position) => {
      this.onComplete(this.value); // Вызываем обработчик события onComplete
    };
  }

  round(value) {
    // Если шаг меньше 1, возвращаем исходное значение
    if (this.step < 1) return value;

    // Возвращаем округленное значение
    return Math.round((value - this.min) / this.step) * this.step + this.min;
  }

  limitValue(value) {
    // Получаем максимальное и минимальное значение
    const max = Math.max(this.max, this.min);
    const min = Math.min(this.max, this.min);

    // Возвращаем значение value, ограниченное максимальным и минимальным значением
    return Math.min(Math.max(value, min), max);
  }

  // Определение функции limitPosition, которая ограничивает позицию в определенных границах
  limitPosition(position) {
    // Возвращение минимального значения между максимальным и 0, где position - позиция элемента, а this.track.offsetWidth - ширина трека
    return Math.min(Math.max(position, 0), this.track.offsetWidth);
  }

  // Определение функции percentsFromValue, которая определяет процентное значение между минимальным и максимальным значением на основе текущего значения
  percentsFromValue(value) {
    // Возвращение процентного значения текущего значения на основе диапазона между минимальным и максимальным значениями
    return (value - this.min) / (this.max - this.min);
  }

  // Определение функции valueFromPosition, которая определяет значение на основе позиции элемента на треке
  valueFromPosition(position) {
    // Определение значения в пределах диапазона между минимальным и максимальным значениями на основе позиции элемента и ширины трека
    return (
      this.min + (this.max - this.min) * (position / this.track.offsetWidth)
    );
  }

  // Определение функции positionFromValue, которая определяет позицию элемента на треке на основе заданного значения
  positionFromValue(value) {
    // Определение процентного значения для заданного значения и умножение на ширину трека
    return this.percentsFromValue(value) * this.track.offsetWidth;
  }

  // Определение функции setHandlePosition, которая устанавливает позицию ползунка на основе текущего значения
  setHandlePosition() {
    // Установка свойства left элемента handle, основываясь на текущем значении, переведенном в проценты от ширины трека
    this.handle.style.left = this.percentsFromValue(this.value) * 100 + "%";
  }
}

class Preferences {
  constructor(game) {
    // конструктор класса, который принимает экземпляр игры и сохраняет его в свойстве game

    this.game = game; // сохраняем экземпляр игры в свойстве класса
  }

  init() {
    this.ranges = {
      // создаем объект this.ranges

      size: new Range("size", {
        // создаем объект Range для размера куба
        value: this.game.cube.size, // начальное значение - размер куба
        range: [2, 5], // диапазон значений
        step: 1, // шаг
        onUpdate: (value) => {
          // функция, вызываемая при обновлении значения

          this.game.cube.size = value; // сохраняем новое значение размера куба в свойство game.cube.size

          this.game.preferences.ranges.scramble.list.forEach((item, i) => {
            // обновляем значение длины перемешивания на кнопках

            item.innerHTML =
              this.game.scrambler.scrambleLength[this.game.cube.size][i];
          });
        },
        onComplete: () => this.game.storage.savePreferences(), // функция, вызываемая при завершении обновления значения
      }),

      flip: new Range("flip", {
        // Создание объекта диапазона с параметрами flip
        value: this.game.controls.flipConfig,
        range: [0, 2],
        step: 1,
        // Обновление значения при изменении пользователем
        onUpdate: (value) => {
          this.game.controls.flipConfig = value;
        },
        onComplete: () => this.game.storage.savePreferences(), // Выполнение функции при завершении обновления
      }),

      scramble: new Range("scramble", {
        // Создание объекта диапазона с параметрами scramble
        value: this.game.scrambler.dificulty,
        range: [0, 2],
        step: 1,
        // Обновление значения при изменении пользователем
        onUpdate: (value) => {
          this.game.scrambler.dificulty = value;
        },
        onComplete: () => this.game.storage.savePreferences(), // Выполнение функции при завершении обновления
      }),

      fov: new Range("fov", {
        // Создание объекта диапазона с параметрами fov
        value: this.game.world.fov,
        range: [2, 45],
        // Обновление значения при изменении пользователем
        onUpdate: (value) => {
          this.game.world.fov = value;
          this.game.world.resize();
        },
        onComplete: () => this.game.storage.savePreferences(), // Выполнение функции при завершении обновления
      }),
    };

    // Изменение отображаемой информации на странице в зависимости от настроек перемешивания
    this.ranges.scramble.list.forEach((item, i) => {
      item.innerHTML =
        this.game.scrambler.scrambleLength[this.game.cube.size][i];
    });
  }
}

class Scores {
  constructor(game) {
    this.game = game; // Ссылка на игру, которой принадлежит эта статистика

    // Объект, содержащий статистику по решению головоломки для каждого размера кубика
    this.data = {
      2: {
        scores: [],
        solves: 0,
        best: 0,
      },
      3: {
        scores: [],
        solves: 0,
        best: 0,
      },
      4: {
        scores: [],
        solves: 0,
        best: 0,
      },
      5: {
        scores: [],
        solves: 0,
        best: 0,
      },
    };
  }

  // Метод добавления результата решения головоломки
  addScore(time) {
    // Получаем данные статистики для текущего размера кубика
    const data = this.data[this.game.cube.sizeGenerated];

    // Добавляем время решения в массив решений для текущего размера кубика и увеличиваем счётчик решений
    data.scores.push(time);
    data.solves++;

    // Если количество решений превысило 100, удаляем старые
    if (data.scores.lenght > 100) data.scores.shift();

    // Проверяем, является ли текущее время лучшим временем
    let bestTime = false;

    if (time < data.best || data.best === 0) {
      // Если текущее время лучше предыдущего или нет предыдущего лучшего времени, обновляем лучшее время
      data.best = time;
      bestTime = true;
    }

    // Сохраняем данные статистики
    this.game.storage.saveScores();

    // Возвращаем результат: true, если текущее время является лучшим, false - в противном случае
    return bestTime;
  }

  calcStats() {
    // Получение размера кубика и данных для этого размера
    const s = this.game.cube.sizeGenerated;
    const data = this.data[s];

    // Установка статистических данных на странице
    this.setStat("cube-size", `${s}<i>x</i>${s}<i>x</i>${s}`);
    this.setStat("total-solves", data.solves);
    this.setStat("best-time", this.convertTime(data.best));
  }

  // Функция для установки статистических данных на странице
  setStat(name, value) {
    // Если значение равно нулю, заменить его на "-"
    if (value === 0) value = "-";

    // Получение элемента статистики и установка нового значения
    this.game.dom.stats.querySelector(`.stats[name="${name}"] b`).innerHTML =
      value;
  }

  // Функция для преобразования времени в формат минуты:секунды
  convertTime(time) {
    // Если время меньше или равно 0, вернуть 0
    if (time <= 0) return 0;

    // Преобразование времени в минуты и секунды
    const seconds = parseInt((time / 1000) % 60);
    const minutes = parseInt(time / (1000 * 60));

    // Возврат времени в формате минуты:секунды
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }
}

class Storage {
  constructor(game) {
    this.game = game;

    // Получение версии игры из localStorage
    const userVersion = localStorage.getItem("theCube_version");

    // Если версия не найдена или отличается от текущей версии игры, то
    if (!userVersion || userVersion !== window.gameVersion) {
      this.clearGame(); // Очистка данных об игре
      this.clearPreferences(); // Очистка пользовательских настроек
      this.migrateScores(); // Миграция старых счетов
      localStorage.setItem("theCube_version", window.gameVersion); // Сохранение текущей версии игры в localStorage
    }
  }

  init() {
    this.loadPreferences(); // Загрузка пользовательских настроек
    this.loadScores(); // Загрузка результатов игроков
  }

  loadGame() {
    // Загрузка сохраненной игры

    try {
      // Проверяем, запущена ли какая-то игра
      const gameInProgress = localStorage.getItem("theCube_playing") === "true";

      if (!gameInProgress) throw new Error();

      // Получаем данные сохраненной игры и время
      const gameCubeData = JSON.parse(
        localStorage.getItem("theCube_savedState")
      );
      const gameTime = parseInt(localStorage.getItem("theCube_time"));

      // Проверяем, что данные не пустые и размер куба совпадает с текущим
      if (!gameCubeData || gameTime === null) throw new Error();
      if (gameCubeData.size !== this.game.cube.sizeGenerated) throw new Error();

      // Загружаем данные куба и время игры
      this.game.cube.loadFromData(gameCubeData);

      this.game.timer.deltaTime = gameTime;

      // Устанавливаем флаг, что игра сохранена
      this.game.saved = true;
    } catch (e) {
      // Если произошла ошибка, устанавливаем флаг, что игра не сохранена
      this.game.saved = false;
    }
  }

  saveGame() {
    // Сохранение текущей игры

    const gameInProgress = true; // Устанавливаем флаг, что игра запущена
    // Создаем объект с данными куба и сохраняем время игры
    const gameCubeData = { names: [], positions: [], rotations: [] };
    const gameTime = this.game.timer.deltaTime;

    gameCubeData.size = this.game.cube.sizeGenerated;

    // Для каждого кусочка на кубе сохраняем его имя, позицию и вектор поворота
    this.game.cube.pieces.forEach((piece) => {
      gameCubeData.names.push(piece.name);
      gameCubeData.positions.push(piece.position);
      gameCubeData.rotations.push(piece.rotation.toVector3());
    });

    // Сохраняем флаг игры, данные куба и время
    localStorage.setItem("theCube_playing", gameInProgress);
    localStorage.setItem("theCube_savedState", JSON.stringify(gameCubeData));
    localStorage.setItem("theCube_time", gameTime);
  }

  clearGame() {
    // Функция для очистки данных игры в локальном хранилище

    localStorage.removeItem("theCube_playing"); // Удаление сохраненной игры
    localStorage.removeItem("theCube_savedState"); // Удаление сохраненного состояния игры
    localStorage.removeItem("theCube_time"); // Удаление времени игры
  }

  loadScores() {
    // Функция для загрузки счетов из локального хранилища

    try {
      // Получение данных счетов из локального хранилища
      const scoresData = JSON.parse(localStorage.getItem("theCube_scores"));

      // В случае отсутствия данных в хранилище выбрасывается ошибка
      if (!scoresData) throw new Error();

      // Сохранение данных в свойство игры
      this.game.scores.data = scoresData;
    } catch (e) {} // Обработка ошибки
  }

  saveScores() {
    // Функция для сохранения счетов в локальное хранилище

    const scoresData = this.game.scores.data; // Получение данных счетов из свойства игры

    localStorage.setItem("theCube_scores", JSON.stringify(scoresData)); // Сохранение данных в локальное хранилище
  }

  clearScores() {
    // Функция для очистки счетов в локальном хранилище

    localStorage.removeItem("theCube_scores"); // Удаление сохраненных счетов из локального хранилища
  }

  migrateScores() {
    // Функция переноса данных об очках из localStorage в объект игры

    try {
      // Получаем данные об очках из localStorage и парсим их
      const scoresData = JSON.parse(localStorage.getItem("theCube_scoresData"));
      const scoresBest = parseInt(localStorage.getItem("theCube_scoresBest"));
      const scoresSolves = parseInt(
        localStorage.getItem("theCube_scoresSolves")
      );

      // Если какие-то данные отсутствуют, то возвращаем false
      if (!scoresData || !scoresBest || !scoresSolves) return false;

      // Присваиваем полученные значения в соответствующие свойства объекта игры
      this.game.scores.data[3].scores = scoresData;
      this.game.scores.data[3].best = scoresBest;
      this.game.scores.data[3].solves = scoresSolves;
      // Удаляем данные из localStorage
      localStorage.removeItem("theCube_scoresData");
      localStorage.removeItem("theCube_scoresBest");
      localStorage.removeItem("theCube_scoresSolves");
    } catch (e) {}
  }

  loadPreferences() {
    // Функция загрузки настроек из localStorage в объект игры

    try {
      // Получаем настройки из localStorage и парсим их
      const preferences = JSON.parse(
        localStorage.getItem("theCube_preferences")
      );

      // Если данные отсутствуют, то вызываем исключение
      if (!preferences) throw new Error();

      // Присваиваем полученные значения в соответствующие свойства объекта игры
      this.game.cube.size = parseInt(preferences.cubeSize);
      this.game.controls.flipConfig = parseInt(preferences.flipConfig);
      this.game.scrambler.dificulty = parseInt(preferences.dificulty);

      this.game.world.fov = parseFloat(preferences.fov);
      this.game.world.resize();

      this.game.themes.colors = preferences.colors;
      this.game.themes.setTheme(preferences.theme);

      return true; // Возвращаем true, если все настройки успешно загружены
    } catch (e) {
      // Если какие-то настройки не были найдены в localStorage, то устанавливаем значения по умолчанию
      this.game.cube.size = 3;
      this.game.controls.flipConfig = 0;
      this.game.scrambler.dificulty = 1;

      this.game.world.fov = 10;
      this.game.world.resize();

      this.game.themes.setTheme("cube");

      // Сохраняем настройки в localStorage
      this.savePreferences();

      return false; // Возвращаем false, если настройки не удалось загрузить
    }
  }

  savePreferences() {
    // Метод сохранения настроек в localStorage

    // Создание объекта с настройками, которые нужно сохранить
    const preferences = {
      cubeSize: this.game.cube.size, // размер кубика
      flipConfig: this.game.controls.flipConfig, // настройки поворота кубика
      dificulty: this.game.scrambler.dificulty, // уровень сложности скрамбла
      fov: this.game.world.fov, // угол обзора
      theme: this.game.themes.theme, // тема игры
      colors: this.game.themes.colors, // цвета темы
    };

    // Сохранение объекта в localStorage в виде строки JSON
    localStorage.setItem("theCube_preferences", JSON.stringify(preferences));
  }

  clearPreferences() {
    // Метод удаления сохраненных настроек из localStorage

    localStorage.removeItem("theCube_preferences");
  }
}

class Themes {
  constructor(game) {
    this.game = game;
    this.theme = null;

    this.defaults = {
      cube: {
        U: 0xfff7ff, // white
        D: 0xffef48, // yellow
        F: 0xef3923, // red
        R: 0x41aac8, // blue
        B: 0xff8c0a, // orange
        L: 0x82ca38, // green
        P: 0x08101a, // piece
        G: 0xffffff, // background
      },
    };

    this.colors = JSON.parse(JSON.stringify(this.defaults));
  }

  getColors() {
    return this.colors[this.theme];
  }

  setTheme(theme = false, force = false) {
    if (theme === this.theme && force === false) return;
    if (theme !== false) this.theme = theme;

    const colors = this.getColors();

    this.game.dom.prefs
      .querySelectorAll(".range__handle div")
      .forEach((range) => {
        range.style.background = "#" + colors.R.toString(16).padStart(6, "0");
      });

    this.game.cube.updateColors(colors);

    this.game.dom.back.style.background =
      "#" + colors.G.toString(16).padStart(6, "0");
  }
}

const States = {
  3: {
    checkerboard: {
      names: [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26,
      ],
      positions: [
        { x: 1 / 3, y: -1 / 3, z: 1 / 3 },
        { x: -1 / 3, y: 1 / 3, z: 0 },
        { x: 1 / 3, y: -1 / 3, z: -1 / 3 },
        { x: -1 / 3, y: 0, z: -1 / 3 },
        { x: 1 / 3, y: 0, z: 0 },
        { x: -1 / 3, y: 0, z: 1 / 3 },
        { x: 1 / 3, y: 1 / 3, z: 1 / 3 },
        { x: -1 / 3, y: -1 / 3, z: 0 },
        { x: 1 / 3, y: 1 / 3, z: -1 / 3 },
        { x: 0, y: 1 / 3, z: -1 / 3 },
        { x: 0, y: -1 / 3, z: 0 },
        { x: 0, y: 1 / 3, z: 1 / 3 },
        { x: 0, y: 0, z: 1 / 3 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: -1 / 3 },
        { x: 0, y: -1 / 3, z: -1 / 3 },
        { x: 0, y: 1 / 3, z: 0 },
        { x: 0, y: -1 / 3, z: 1 / 3 },
        { x: -1 / 3, y: -1 / 3, z: 1 / 3 },
        { x: 1 / 3, y: 1 / 3, z: 0 },
        { x: -1 / 3, y: -1 / 3, z: -1 / 3 },
        { x: 1 / 3, y: 0, z: -1 / 3 },
        { x: -1 / 3, y: 0, z: 0 },
        { x: 1 / 3, y: 0, z: 1 / 3 },
        { x: -1 / 3, y: 1 / 3, z: 1 / 3 },
        { x: 1 / 3, y: -1 / 3, z: 0 },
        { x: -1 / 3, y: 1 / 3, z: -1 / 3 },
      ],
      rotations: [
        { x: -Math.PI, y: 0, z: Math.PI },
        { x: Math.PI, y: 0, z: 0 },
        { x: -Math.PI, y: 0, z: Math.PI },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: Math.PI },
        { x: 0, y: 0, z: 0 },
        { x: -Math.PI, y: 0, z: Math.PI },
        { x: Math.PI, y: 0, z: 0 },
        { x: -Math.PI, y: 0, z: Math.PI },
        { x: 0, y: 0, z: Math.PI },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: Math.PI },
        { x: -Math.PI, y: 0, z: 0 },
        { x: Math.PI, y: 0, z: Math.PI },
        { x: Math.PI, y: 0, z: 0 },
        { x: 0, y: 0, z: Math.PI },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: Math.PI },
        { x: Math.PI, y: 0, z: Math.PI },
        { x: -Math.PI, y: 0, z: 0 },
        { x: Math.PI, y: 0, z: Math.PI },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: Math.PI },
        { x: 0, y: 0, z: 0 },
        { x: Math.PI, y: 0, z: Math.PI },
        { x: -Math.PI, y: 0, z: 0 },
        { x: Math.PI, y: 0, z: Math.PI },
      ],
      size: 3,
    },
  },
};

class IconsConverter {
  // Объявление класса IconsConverter

  constructor(options) {
    // Конструктор класса с передачей параметров

    // Определение параметров по умолчанию, если они не переданы
    options = Object.assign(
      {
        tagName: "icon",
        className: "icon",
        styles: false,
        icons: {},
        observe: false,
        convert: false,
      },
      options || {}
    );

    // Определение свойств класса
    this.tagName = options.tagName;
    this.className = options.className;
    this.icons = options.icons;

    // Создание элемента SVG
    this.svgTag = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svgTag.setAttribute("class", this.className);

    // Если задано свойство styles, добавление стилей
    if (options.styles) this.addStyles();
    // Если задано свойство convert, конвертация всех иконок
    if (options.convert) this.convertAllIcons();

    // Если задано свойство observe, наблюдение за изменениями DOM-дерева и конвертация иконок при изменениях
    if (options.observe) {
      // Определение MutationObserver для наблюдения за изменениями
      const MutationObserver =
        window.MutationObserver || window.WebKitMutationObserver;
      this.observer = new MutationObserver((mutations) => {
        this.convertAllIcons();
      });
      // Начало наблюдения
      this.observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }

    return this; // Возвращение объекта класса
  }

  convertAllIcons() {
    // Получаем все иконки на странице с помощью метода querySelectorAll() и применяем метод convertIcon() для каждой из них
    document.querySelectorAll(this.tagName).forEach((icon) => {
      this.convertIcon(icon);
    });
  }

  convertIcon(icon) {
    // Объявление метода convertIcon(), который конвертирует отдельную иконку

    // Получаем данные о свг-иконке из объекта icons и проверяем, определены ли эти данные
    const svgData = this.icons[icon.attributes[0].localName];

    if (typeof svgData === "undefined") return;

    // Клонируем тэг <svg> с заданными свойствами
    const svg = this.svgTag.cloneNode(true);
    const viewBox = svgData.viewbox.split(" ");

    svg.setAttributeNS(null, "viewBox", svgData.viewbox);
    svg.style.width = viewBox[2] / viewBox[3] + "em";
    svg.style.height = "1em";
    svg.innerHTML = svgData.content;

    // Заменяем иконку на сконвертированный svg
    icon.parentNode.replaceChild(svg, icon);
  }

  addStyles() {
    // Объявление метода addStyles(), который добавляет стили для отображения svg-иконок

    // Создаем элемент <style>, задаем его содержимое и добавляем в <head> документа
    const style = document.createElement("style");
    style.innerHTML = `.${this.className} { display: inline-block; font-size: inherit; overflow: visible; vertical-align: -0.125em; preserveAspectRatio: none; }`;
    document.head.appendChild(style);
  }
}

const Icons = new IconsConverter({
  icons: {
    settings: {
      viewbox: "0 0 512 512",
      content:
        '<path fill="currentColor" d="M444.788 291.1l42.616 24.599c4.867 2.809 7.126 8.618 5.459 13.985-11.07 35.642-29.97 67.842-54.689 94.586a12.016 12.016 0 0 1-14.832 2.254l-42.584-24.595a191.577 191.577 0 0 1-60.759 35.13v49.182a12.01 12.01 0 0 1-9.377 11.718c-34.956 7.85-72.499 8.256-109.219.007-5.49-1.233-9.403-6.096-9.403-11.723v-49.184a191.555 191.555 0 0 1-60.759-35.13l-42.584 24.595a12.016 12.016 0 0 1-14.832-2.254c-24.718-26.744-43.619-58.944-54.689-94.586-1.667-5.366.592-11.175 5.459-13.985L67.212 291.1a193.48 193.48 0 0 1 0-70.199l-42.616-24.599c-4.867-2.809-7.126-8.618-5.459-13.985 11.07-35.642 29.97-67.842 54.689-94.586a12.016 12.016 0 0 1 14.832-2.254l42.584 24.595a191.577 191.577 0 0 1 60.759-35.13V25.759a12.01 12.01 0 0 1 9.377-11.718c34.956-7.85 72.499-8.256 109.219-.007 5.49 1.233 9.403 6.096 9.403 11.723v49.184a191.555 191.555 0 0 1 60.759 35.13l42.584-24.595a12.016 12.016 0 0 1 14.832 2.254c24.718 26.744 43.619 58.944 54.689 94.586 1.667 5.366-.592 11.175-5.459 13.985L444.788 220.9a193.485 193.485 0 0 1 0 70.2zM336 256c0-44.112-35.888-80-80-80s-80 35.888-80 80 35.888 80 80 80 80-35.888 80-80z" />',
    },
    back: {
      viewbox: "0 0 512 512",
      content:
        '<path transform="translate(512, 0) scale(-1,1)" fill="currentColor" d="M503.691 189.836L327.687 37.851C312.281 24.546 288 35.347 288 56.015v80.053C127.371 137.907 0 170.1 0 322.326c0 61.441 39.581 122.309 83.333 154.132 13.653 9.931 33.111-2.533 28.077-18.631C66.066 312.814 132.917 274.316 288 272.085V360c0 20.7 24.3 31.453 39.687 18.164l176.004-152c11.071-9.562 11.086-26.753 0-36.328z" />',
    },
    trophy: {
      viewbox: "0 0 576 512",
      content:
        '<path fill="currentColor" d="M552 64H448V24c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24v40H24C10.7 64 0 74.7 0 88v56c0 66.5 77.9 131.7 171.9 142.4C203.3 338.5 240 360 240 360v72h-48c-35.3 0-64 20.7-64 56v12c0 6.6 5.4 12 12 12h296c6.6 0 12-5.4 12-12v-12c0-35.3-28.7-56-64-56h-48v-72s36.7-21.5 68.1-73.6C498.4 275.6 576 210.3 576 144V88c0-13.3-10.7-24-24-24zM64 144v-16h64.2c1 32.6 5.8 61.2 12.8 86.2-47.5-16.4-77-49.9-77-70.2zm448 0c0 20.2-29.4 53.8-77 70.2 7-25 11.8-53.6 12.8-86.2H512v16zm-127.3 4.7l-39.6 38.6 9.4 54.6c1.7 9.8-8.7 17.2-17.4 12.6l-49-25.8-49 25.8c-8.8 4.6-19.1-2.9-17.4-12.6l9.4-54.6-39.6-38.6c-7.1-6.9-3.2-19 6.7-20.5l54.8-8 24.5-49.6c4.4-8.9 17.1-8.9 21.5 0l24.5 49.6 54.8 8c9.6 1.5 13.5 13.6 6.4 20.5z" />',
    },
    cancel: {
      viewbox: "0 0 352 512",
      content:
        '<path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z" />',
    },
    theme: {
      viewbox: "0 0 512 512",
      content:
        '<path fill="currentColor" d="M204.3 5C104.9 24.4 24.8 104.3 5.2 203.4c-37 187 131.7 326.4 258.8 306.7 41.2-6.4 61.4-54.6 42.5-91.7-23.1-45.4 9.9-98.4 60.9-98.4h79.7c35.8 0 64.8-29.6 64.9-65.3C511.5 97.1 368.1-26.9 204.3 5zM96 320c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm32-128c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128-64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128 64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"/>',
    },
    reset: {
      viewbox: "0 0 512 512",
      content:
        '<path fill="currentColor" d="M370.72 133.28C339.458 104.008 298.888 87.962 255.848 88c-77.458.068-144.328 53.178-162.791 126.85-1.344 5.363-6.122 9.15-11.651 9.15H24.103c-7.498 0-13.194-6.807-11.807-14.176C33.933 94.924 134.813 8 256 8c66.448 0 126.791 26.136 171.315 68.685L463.03 40.97C478.149 25.851 504 36.559 504 57.941V192c0 13.255-10.745 24-24 24H345.941c-21.382 0-32.09-25.851-16.971-40.971l41.75-41.749zM32 296h134.059c21.382 0 32.09 25.851 16.971 40.971l-41.75 41.75c31.262 29.273 71.835 45.319 114.876 45.28 77.418-.07 144.315-53.144 162.787-126.849 1.344-5.363 6.122-9.15 11.651-9.15h57.304c7.498 0 13.194 6.807 11.807 14.176C478.067 417.076 377.187 504 256 504c-66.448 0-126.791-26.136-171.315-68.685L48.97 471.03C33.851 486.149 8 475.441 8 454.059V320c0-13.255 10.745-24 24-24z" />',
    },
    trash: {
      viewbox: "0 0 448 512",
      content:
        '<path fill="currentColor" d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z" />',
    },
  },

  convert: true,
});

const STATE = {
  Menu: 0,
  Playing: 1,
  Complete: 2,
  Stats: 3,
  Prefs: 4,
};

const BUTTONS = {
  Menu: ["stats", "prefs"],
  Playing: ["back"],
  Complete: [],
  Stats: [],
  Prefs: ["back"],
  None: [],
};

const SHOW = true;
const HIDE = false;

class Game {
  constructor() {
    this.dom = {
      ui: document.querySelector(".ui"), // DOM-элемент блока UI
      game: document.querySelector(".ui__game"), // DOM-элемент игрового поля
      back: document.querySelector(".ui__background"), // DOM-элемент фона
      prefs: document.querySelector(".ui__prefs"), // DOM-элемент блока настроек
      stats: document.querySelector(".ui__stats"), // DOM-элемент блока статистики
      texts: {
        // Объект, содержащий ссылки на DOM-элементы текстов
        title: document.querySelector(".text--title"), // DOM-элемент заголовка
        note: document.querySelector(".text--note"), // DOM-элемент подсказки
        timer: document.querySelector(".text--timer"), // DOM-элемент таймера
        complete: document.querySelector(".text--complete"), // DOM-элемент сообщения об окончании игры
        best: document.querySelector(".text--best-time"), // DOM-элемент сообщения с лучшим временем игры
      },
      buttons: {
        // Объект, содержащий ссылки на DOM-элементы кнопок
        prefs: document.querySelector(".btn--prefs"), // DOM-элемент кнопки настроек
        back: document.querySelector(".btn--back"), // DOM-элемент кнопки "назад"
        stats: document.querySelector(".btn--stats"), // DOM-элемент кнопки статистики
        reset: document.querySelector(".btn--reset"), // DOM-элемент кнопки сброса
      },
    };

    // Создаем экземпляры объектов
    this.world = new World(this);
    this.cube = new Cube(this);
    this.controls = new Controls(this);
    this.scrambler = new Scrambler(this);
    this.transition = new Transition(this);
    this.timer = new Timer(this);
    this.preferences = new Preferences(this);
    this.scores = new Scores(this);
    this.storage = new Storage(this);
    this.themes = new Themes(this);

    // Вызываем метод для инициализации обработчиков событий
    this.initActions();

    // Устанавливаем начальное состояние игры
    this.state = STATE.Menu;
    this.newGame = false;
    this.saved = false;

    // Инициализируем объекты
    this.storage.init();
    this.preferences.init();
    this.cube.init();
    this.transition.init();

    // Загружаем сохраненную игру и вычисляем статистику
    this.storage.loadGame();
    this.scores.calcStats();

    // Задержка перед выполнением следующих действий
    setTimeout(() => {
      // Показываем анимацию перехода и отображаем куб
      this.transition.float();
      this.transition.cube(SHOW);

      // Показываем заголовок и скрываем кнопки
      setTimeout(() => this.transition.title(SHOW), 700);
      setTimeout(
        () => this.transition.buttons(BUTTONS.Menu, BUTTONS.None),
        1000
      );
    }, 500);
  }

  initActions() {
    // задаем переменную tappedTwice и устанавливаем ее в false
    let tappedTwice = false;

    // добавляем обработчик события 'click' на элемент с классом 'game'
    this.dom.game.addEventListener(
      "click",
      (event) => {
        // если есть активные переходы, прерываем функцию
        if (this.transition.activeTransitions > 0) return;
        // если игра уже запущена, прерываем функцию
        if (this.state === STATE.Playing) return;

        // если меню открыто
        if (this.state === STATE.Menu) {
          // если tappedTwice равно false
          if (!tappedTwice) {
            // устанавливаем tappedTwice в true
            tappedTwice = true;
            // через 300 миллисекунд устанавливаем tappedTwice в false
            setTimeout(() => (tappedTwice = false), 300);
            return false;
          }

          this.game(SHOW); // показываем игру
        } else if (this.state === STATE.Complete) {
          // если игра завершена

          this.complete(HIDE); // скрываем окно завершения
        } else if (this.state === STATE.Stats) {
          // если показаны статистические данные

          this.stats(HIDE); // скрываем статистику
        }
      },
      false
    );

    // добавляем обработчик события onMove на элемент управления
    this.controls.onMove = () => {
      // если новая игра только началась
      if (this.newGame) {
        // запускаем таймер и устанавливаем новую игру в false
        this.timer.start(true);
        this.newGame = false;
      }
    };

    // добавляем обработчик события 'click' на элемент с классом 'back'
    this.dom.buttons.back.onclick = (event) => {
      // если есть активные переходы, прерываем функцию
      if (this.transition.activeTransitions > 0) return;

      // если игра запущена
      if (this.state === STATE.Playing) {
        this.game(HIDE); // скрываем окно игры
      } else if (this.state === STATE.Prefs) {
        // если показаны настройки

        this.prefs(HIDE); // скрываем настройки
      }
    };

    this.dom.buttons.reset.onclick = (event) => {
      // Назначение обработчика клика на кнопку reset

      if (this.state === STATE.Theme) {
        // Если текущее состояние - Theme, то вызываем метод resetTheme у themeEditor

        this.themeEditor.resetTheme();
      }
    };

    this.dom.buttons.prefs.onclick = (event) => this.prefs(SHOW); // Назначение обработчика клика на кнопку prefs

    this.dom.buttons.stats.onclick = (event) => this.stats(SHOW); // Назначение обработчика клика на кнопку stats

    this.controls.onSolved = () => this.complete(SHOW); // Колбэк, вызываемый при решении головоломки
  }

  game(show) {
    if (show) {
      // Если show == true, то выполняем следующее

      // Если игра не сохранена, то перемешиваем куб и включаем режим новой игры
      if (!this.saved) {
        this.scrambler.scramble();
        this.controls.scrambleCube();
        this.newGame = true;
      }

      // Вычисляем длительность перехода
      const duration = this.saved
        ? 0
        : this.scrambler.converted.length * (this.controls.flipSpeeds[0] + 10);

      // Устанавливаем состояние "Играем" и сохраняем игру
      this.state = STATE.Playing;
      this.saved = true;

      // Выполняем переходы
      this.transition.buttons(BUTTONS.None, BUTTONS.Menu);

      this.transition.zoom(STATE.Playing, duration);
      this.transition.title(HIDE);

      // Выполняем отложенный код
      setTimeout(() => {
        this.transition.timer(SHOW);
        this.transition.buttons(BUTTONS.Playing, BUTTONS.None);
      }, this.transition.durations.zoom - 1000);

      setTimeout(() => {
        this.controls.enable();
        if (!this.newGame) this.timer.start(true);
      }, this.transition.durations.zoom);
    } else {
      // Если show == false, то выполняем следующее

      // Устанавливаем состояние "Меню"
      this.state = STATE.Menu;

      // Выполняем переходы
      this.transition.buttons(BUTTONS.Menu, BUTTONS.Playing);

      this.transition.zoom(STATE.Menu, 0);

      // Отключаем управление и таймер
      this.controls.disable();
      if (!this.newGame) this.timer.stop();
      this.transition.timer(HIDE);

      // Выполняем отложенный код
      setTimeout(
        () => this.transition.title(SHOW),
        this.transition.durations.zoom - 1000
      );

      // Сбрасываем флаг playing и отключаем управление
      this.playing = false;
      this.controls.disable();
    }
  }

  prefs(show) {
    // Определяем функцию prefs с аргументом show

    // Если аргумент show равен true
    if (show) {
      // Если есть активные переходы, выходим из функции
      if (this.transition.activeTransitions > 0) return;

      // Устанавливаем состояние настроек
      this.state = STATE.Prefs;

      // Производим анимацию кнопок, переход к меню и куба
      this.transition.buttons(BUTTONS.Prefs, BUTTONS.Menu);

      this.transition.title(HIDE);
      this.transition.cube(HIDE);

      // Задержка в 1 секунду и производим анимацию настроек
      setTimeout(() => this.transition.preferences(SHOW), 1000);
    } else {
      // Изменяем размер куба
      this.cube.resize();

      // Устанавливаем состояние меню
      this.state = STATE.Menu;

      // Производим анимацию кнопок и настроек
      this.transition.buttons(BUTTONS.Menu, BUTTONS.Prefs);

      this.transition.preferences(HIDE);

      // Задержки в 500 мс и 1.2 секунды и производим анимацию куба и заголовка
      setTimeout(() => this.transition.cube(SHOW), 500);
      setTimeout(() => this.transition.title(SHOW), 1200);
    }
  }

  stats(show) {
    // Функция для управления статистикой

    if (show) {
      // Если активно какое-то переходное состояние, прекратить
      if (this.transition.activeTransitions > 0) return;

      this.state = STATE.Stats; // Устанавливаем текущее состояние на "статистика"

      this.transition.buttons(BUTTONS.Stats, BUTTONS.Menu); // Производим переход для кнопок

      // Скрываем заголовок и куб
      this.transition.title(HIDE);
      this.transition.cube(HIDE);

      // Показываем статистику после задержки в 1 секунду
      setTimeout(() => this.transition.stats(SHOW), 1000);
    } else {
      // Устанавливаем текущее состояние на "меню"
      this.state = STATE.Menu;

      // Производим переход для кнопок
      this.transition.buttons(BUTTONS.Menu, BUTTONS.None);

      // Скрываем статистику
      this.transition.stats(HIDE);

      setTimeout(() => this.transition.cube(SHOW), 500); // Показываем куб после задержки в 0.5 секунды
      setTimeout(() => this.transition.title(SHOW), 1200); // Показываем заголовок после задержки в 1.2 секунды
    }
  }

  complete(show) {
    if (show) {
      // Если show равен true, то выполняются действия внутри этого блока

      // Запускается анимация перехода между состояниями кнопок с помощью функции buttons
      this.transition.buttons(BUTTONS.Complete, BUTTONS.Playing);

      // Состояние игры меняется на Complete
      this.state = STATE.Complete;
      // Признак сохраненности игры устанавливается в false
      this.saved = false;

      // Управление кубом выключается
      this.controls.disable();
      // Таймер останавливается
      this.timer.stop();
      // Удаляются данные о сохраненной игре
      this.storage.clearGame();

      // В переменной bestTime сохраняется результат добавления времени на таймере в список результатов
      this.bestTime = this.scores.addScore(this.timer.deltaTime);

      // Выполняется анимация перехода к состоянию Menu
      this.transition.zoom(STATE.Menu, 0);
      // Выполняется анимация подъема
      this.transition.elevate(SHOW);

      // Запускается таймер, после которого выполняются действия внутри этого блока
      setTimeout(() => {
        // Выполняется анимация завершения игры
        this.transition.complete(SHOW, this.bestTime);
      }, 1000);
    } else {
      // Если show равен false, то выполняются действия внутри этого блока

      // Состояние игры меняется на Stats
      this.state = STATE.Stats;
      // Признак сохраненности игры устанавливается в false
      this.saved = false;

      // Выполняется анимация скрытия таймера
      this.transition.timer(HIDE);
      // Выполняется анимация скрытия завершения игры
      this.transition.complete(HIDE, this.bestTime);
      // Выполняется анимация скрытия куба
      this.transition.cube(HIDE);
      // Таймер сбрасывается
      this.timer.reset();

      // Запускается таймер, после которого выполняются действия внутри этого блока
      setTimeout(() => {
        this.cube.reset(); // Куб возвращается в исходное положение

        this.transition.stats(SHOW); // Выполняется анимация отображения статистики
        this.transition.elevate(0); // Выполняется анимация снижения
      }, 1000);

      return false; // Функция завершает свое выполнение, возвращая значение false
    }
  }
}

window.game = new Game();
