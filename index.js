let container = document.querySelector('#table');
let submit = document.querySelector('#submit');

//рендеринг таблицы
function renderGrid(cols, rows) {
  container.style.setProperty('--grid-cols', cols);
  container.style.setProperty('--grid-rows', rows);
  for (let i = 0; i < (rows * cols); i++) {
    let cell = document.createElement("div");
    let inner = document.createElement('div');
    cell.appendChild(inner).className = 'hidden';
    container.appendChild(cell).className = "table__item";
  };
}

async function request(url) {
  const promise = await fetch(url);
  const response = promise.json();
  return response;  
}

//запрос остановок
request('./data/stations.json')
.then((response) => {
  let respArr = response;  
  let length = respArr.length;

  renderGrid(length, length);
  
//выбираем нужные ячейки из всей таблицы в отдельный массив
  let cells = document.querySelectorAll('.table__item');
  let stations = [];
  
  for (let i=length, n = 0, row = 2; i < cells.length; i+=length, n++, row++) {
    for (let b = 0, col = 1; b <= n; b++, col++) {

      //рендерю имена станций в таблицу
      if (b === n) {
        for (let resItem of respArr) {
          if (resItem.ord === col) {
            cells[i+b-length].firstElementChild.innerText = resItem.name;
          }
        }
      }
      
      //формирую узел для отдельной ячейки, формирую колоночный и строчной индексы для каждой ячейки
      let station = cells[i+b];
      station.dataset.row = row;
      station.dataset.col = col;
      station.style.border = "1px solid black";
      stations.push(station);
    }
  }
  cells[cells.length - 1].firstElementChild.innerText = respArr.filter((item) => item.ord === respArr.length)[0].name;

  //убираю дублирование границы
  for (let i = 1, n = 1; i < stations.length - 1; n++, i+=n) {
    for (let b = 0; b < n; b++) {
      stations[i+b].style.borderTop = 'none';
      stations[i+b].style.borderRight = 'none';
    }
  }
  
  //создаю инпуты, индексирую их
  for (let station of stations) {
    let input = document.createElement('input');
    input.type = 'text';
    input.dataset.row = station.dataset.row;
    input.dataset.col = station.dataset.col;
    station.removeChild(station.firstChild);
    station.appendChild(input).className = 'table__input';
    
    //на основе присвоенных индексов подтягиваю id
    for (let resItem of respArr) {
      if (Number(station.dataset.col) === resItem.ord) {
        station.dataset.id_station1 = resItem.id_station;
      }
      if (Number(station.dataset.row) === resItem.ord) {
        station.dataset.id_station2 = resItem.id_station;
      }
    }
  }

  return [stations, length];
})
.then(([stations, length]) => {
  //запрос цен
  request('./data/prices.json').then((response) => {
    let respArr = response;

    for (let station of stations) {
      for (let item of respArr) {
        if (station.dataset.id_station1 === item.id_station1 && station.dataset.id_station2 === item.id_station2) {
          item.price === -1 ? station.firstElementChild.value = '' : station.firstElementChild.value = item.price;
        }
      }
    }

    //навигация по инпутам
    let inputs = [...document.querySelectorAll('.table__input')];

    for (let input of inputs) {
      input.addEventListener('input', ()=> {
        input.value = input.value.replace(/[^\d.]/g, '');
      })

      input.addEventListener('keydown', function(event) {
        let [col, row] = [event.target.dataset.col, event.target.dataset.row]
        let nextItem;

        function toNextItem(correctCol, correctRow, wrongCol, wrongRow) {
          nextItem = inputs.find(element => (element.dataset.col === correctCol && element.dataset.row === correctRow));
          if (!nextItem) {
            let nextColItem = inputs.find(element => (element.dataset.col === wrongCol && element.dataset.row === wrongRow));
            if (nextColItem) {
              nextItem = nextColItem;
              nextItem.focus();
            }
          } else {
            nextItem.focus();
          }
        };

        if (event.key === 'ArrowDown') {
          toNextItem(col, `${Number(row) + 1}`, `${Number(col) + 1}`, `${Number(col) + 2}`);
        } else if (event.key === 'ArrowUp') {
          toNextItem(col, `${Number(row) - 1}`, `${Number(col) - 1}`, `${length}`);
        } else if (event.key === 'ArrowRight') {
          toNextItem(`${Number(col) + 1}`, row, `1`, `${Number(row) + 1}`);
        } else if (event.key === 'ArrowLeft') {
          toNextItem(`${Number(col) - 1}`, row, `${Number(row) - 2}`, `${Number(row) - 1}`);
        }
      })
    }

    //подтверждение внесенных изменений, вывод в консоль
    submit.addEventListener('click', ()=> {
      for (let input of inputs) {
        let station1 = input.parentNode.dataset.id_station1;
        let station2 = input.parentNode.dataset.id_station2;
        let value = (!input.value || !Number(input.value)) ? -1  : Number(input.value);

        for (let item of respArr) {
          if (item.id_station1 === station1 && item.id_station2 === station2) {
            item.price = value;
          }
        }
      }
      console.log(JSON.stringify(respArr));
    })
  });
})

