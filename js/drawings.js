'use strict';

(() => {
    let points = [];
    let pointsCounter = 0;
    let stateBuffer = [];

    let drag = {
        active: false,
        el: undefined,
        offsetY: 0,
        offsetX: 0,
        clear() {
            this.active = false;
            if (this.el.getBoundingClientRect().top < 100 && this.el.getBoundingClientRect().left < 100) {
                removePointEdges(this.el);
                this.el.remove();
                redrawEdges();
            }
            this.el = undefined;

            document.querySelector('.trash').style.display = 'none';

            console.log('drag mode deactivated');
        },
        activate(el, startX, startY) {
            fixState();
            this.active = true;
            this.el = el;
            this.offsetX = el.getBoundingClientRect().left - startX;
            this.offsetY = el.getBoundingClientRect().top - startY;

            document.querySelector('.trash').style.display = 'block';

            console.log('drag mode activated');
        },
        move(x, y) {
            this.el.style.top = y + this.offsetY + 'px';
            this.el.style.left = x + this.offsetX + 'px';
            redrawEdges();
        }
    }



    function updateEventListeners() {
        updatePointsArray()

        for (let point of points) {
            let pointClone = point.cloneNode(true);
            point.parentNode.replaceChild(pointClone, point);

            pointClone.addEventListener('mouseup', (e) => {
                e.stopPropagation()
                if (e.clientY - e.currentTarget.getBoundingClientRect().bottom > 0) {
                    drag.clear();
                }
            });
            pointClone.addEventListener('mousedown', (e) => {
                if (e.clientY - e.currentTarget.getBoundingClientRect().bottom > 0) {
                    drag.activate(e.currentTarget, e.clientX, e.clientY);
                }
            });
            pointClone.addEventListener('input', (e) => {
                redrawEdges();
            });
        }
    };


    document.addEventListener('mouseup', (e) => {
        if (drag.active) {
            drag.clear();
        } else {
            if(points.length == 0) {
                document.querySelector('#introText').style.display = 'none';
            }
            createPoint(e.clientX, e.clientY, 'Точка ' + (pointsCounter + 1));
        }
    })

    document.addEventListener('mousemove', (e) => {
        if (drag.active) {
            drag.move(e.clientX, e.clientY);
        }
    })

    function createPoint(x, y, text = '') {
        // фиксируем старое состояние
        fixState();

        // создаем и настраиваем точку
        let newPoint = document.createElement('div');
        newPoint.classList.add('point');
        newPoint.setAttribute('contenteditable', 'true');
        newPoint.innerHTML = text;
        newPoint.id = 'point' + pointsCounter;

        // добавляем точку на страницу
        let point = document.querySelector('#draw_area').appendChild(newPoint);
        point.style.top = (y - newPoint.offsetHeight - 12) + 'px';
        point.style.left = (x - newPoint.offsetWidth / 2) + 'px';
        pointsCounter++;

        createEdgesForPoint(point);
        updateEventListeners();
    }

    function createEdgesForPoint(point) {
        updatePointsArray();
        for (let curPoint of points) {
            if (point != curPoint) {
                let edge = createEdge(point, curPoint);
                document.querySelector('#draw_area').appendChild(edge);
            }
        }
    }

    function createEdge(start, end) {
        let vector = {
            x1: start.getBoundingClientRect().left + start.offsetWidth / 2,
            y1: start.getBoundingClientRect().top + start.offsetHeight + 8,
            x2: end.getBoundingClientRect().left + end.offsetWidth / 2,
            y2: end.getBoundingClientRect().top + end.offsetHeight + 8
        };
        let edge = document.createElement('div');
        edge.classList.add('edge');
        edge.dataset.start = start.id;
        edge.dataset.end = end.id;

        edge.style.width = getDistance(vector.x1, vector.y1, vector.x2, vector.y2) + 'px';
        edge.style.top = vector.y1 + 'px';
        edge.style.left = vector.x1 + 'px';
        edge.style.transformOrigin = 'left';
        edge.style.transform = `rotate(${getAngle(vector.x1, vector.y1, vector.x2, vector.y2)}deg)`;

        edge.addEventListener('mouseup', (e) => { e.stopPropagation() })
        edge.addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('active');
            console.log(e.clientY - e.currentTarget.getBoundingClientRect().top);
        })

        return edge;
    }

    function touchUpEdge(edge) {
        let start = document.querySelector(`#${edge.dataset.start}`);
        let end = document.querySelector(`#${edge.dataset.end}`);
        let vector = {
            x1: start.getBoundingClientRect().left + start.offsetWidth / 2,
            y1: start.getBoundingClientRect().top + start.offsetHeight + 8,
            x2: end.getBoundingClientRect().left + end.offsetWidth / 2,
            y2: end.getBoundingClientRect().top + end.offsetHeight + 8
        };

        edge.style.width = getDistance(vector.x1, vector.y1, vector.x2, vector.y2) + 'px';
        edge.style.top = vector.y1 + 'px';
        edge.style.left = vector.x1 + 'px';
        edge.style.transformOrigin = 'left';
        edge.style.transform = `rotate(${getAngle(vector.x1, vector.y1, vector.x2, vector.y2)}deg)`;
    }

    function redrawEdges() {
        let edges = document.querySelectorAll('.edge');

        for (let edge of edges) {
            touchUpEdge(edge);
        }
    }
    function removePointEdges(point) {
        let edges = document.querySelectorAll('.edge');

        for (let edge of edges) {
            if (edge.dataset.start == point.id || edge.dataset.end == point.id) {
                edge.remove();
            }
        }
    }

    document.addEventListener('keydown', (e) => {
        if ((e.key == 'z' || e.key == 'Z') && e.ctrlKey) {
            recoverState();
        }
    });

    function fixState() {
        stateBuffer.push(document.querySelector('#draw_area').cloneNode(true));
    }
    function recoverState() {
        let draw_area = document.querySelector('#draw_area');
        draw_area.parentNode.replaceChild(stateBuffer.pop(), draw_area);
        updateEventListeners();
    }

    function updatePointsArray() {
        points = document.querySelectorAll('.point');
    }

    function getAngle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1) / Math.PI * 180;
    }
    function getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }
})();