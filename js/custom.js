function main(p) {

    { // Setup
        p.size(600, 600);
        p.frameRate(60);
    }

    var WAVE_WIDTH = 5;
    var WATER_LEVEL = 200;

    var wavesArray = [];
    var bgWavesArray = [];
    var ballsArray = [];

    var ballMass = 1;

    var ballTimer = 0;
    var ballRecoveryTime = 90;

    // Funções globais
    /**
     * Limita um determinado valor entre o Min e o Max
     * @param {Number} val Valor a ser limitado
     * @param {Number} min Valor minimo
     * @param {Number} max Valor máximo
     */
    function constrain(val, min, max) {
        if (val < min)
            val = min;
        else if (val > max)
            val = max;

        return val;
    }

    constrain


    /**
     * Classe que define as "particulas" das ondas
     */
    class WaveParticle {
        constructor(x) {
            this.id = 0;

            // Posicionamento
            this.pos = new PVector(x, p.height);
            this.height = WATER_LEVEL;
            this.width = WAVE_WIDTH;

            // Estilo
            this.bgColor = p.color(20, 113, 227);
            this.isBackground = false;
            
            // Contadores de tempo
            this.counter = 0;
            this.counting = false;

            // Impacto de particulas ao lado
            this.spreading = false;
            this.nid = this.id + 1;
            this.pid = this.id - 1;

            // Movimentação
            this.friction = 0.003;
            this.acceleration = 0;
            this.lastAcceleration = 0;
            this.velocity = 0;
        }

        /**
         * Desenha a partícula na tela
         */
        draw() {
            p.fill(this.bgColor);
            p.noStroke();
            var posY = -this.height;

            // Se esta onda faz parte do background
            if (this.isBackground) {
                if (this.id > 60) {
                    posY += p.cos(this.counter + this.id * 6.1) * 5;
                } else {
                    posY += p.cos(this.counter + this.id * 6.2) * 5;
                }
            }

            p.rect(this.pos.x, this.pos.y, this.width, posY);
        }

        /**
         * Aplica determinada força à partícula
         * @param {number} f Intensidade da força
         */
        applyForce(f) {
            this.acceleration += f;
            this.lastAcceleration = f;
            this.counter = 0;
            this.counting = true;
            this.nid = this.id + 1;
            this.pid = this.id - 1;
        }

        /**
         * Inicia o movimento das partículas
         */
        setMotion() {
            this.velocity += this.acceleration;
            this.height += -this.velocity * p.cos(this.counter * 2);
            this.acceleration = 0;
        }

        /**
         * Espalha a força do impacto da bola para as partículas do lado.
         * A força perde intensidade pouco a pouco.
         */
        spread() {
            this.lastAcceleration *= 0.999;

            var f = this.lastAcceleration;

            // Verificam se a onda está muito fraca para parar de espalhar a força
            var a = false;
            var b = false;

            if (this.counter % 4 < this.lastAcceleration * 3) {
                if (this.nid < wavesArray.length) {
                    wavesArray[this.nid++].applyForce(f);
                } else {
                    a = true;
                }
                if (this.pid >= 0) {
                    wavesArray[this.pid--].applyForce(f);
                } else {
                    b = true;
                }
                if (a && b) {
                    this.spreading = false;
                }
            }
        }

        /**
         * Aplica força contrária ao movimento para "frear" as ondas
         */
        applyFriction() {
            this.velocity += -this.velocity * this.friction;
        }

        /**
         * Função principal que controla todas as outras
         */
        run() {
            this.draw();
            this.counter += 0.02;
            if (this.counting) {
                this.setMotion();
                this.applyFriction();
                if (this.height < WATER_LEVEL) {
                    this.height += 0.1;
                } else if (this.height > WATER_LEVEL) {
                    this.height -= 0.1;
                }
                if (this.velocity < 0.05) {
                    if (p.abs(this.height - WATER_LEVEL) < 2) {
                        this.height = WATER_LEVEL;
                        this.velocity = 0;
                        this.counting = false;
                    }
                }
                if (this.spreading) {
                    this.spread();
                }
            } else {
                this.velocity = 0;
                this.acceleration = 0;
            }
        }
    }

    /**
     * Classe dos objetos que interagem com a água
     */
    class Ball {
        constructor(x, y, mass) {
            this.barId = -1;

            // Posicionamento
            this.pos = new p.PVector(x, y);
            this.enteredLiquid = false;
            this.inLiquid = false;
            this.firstContact = true;
            this.mass = mass || 1;

            // Estilo
            this.Size = 15 + this.mass * 5;
            
            // Movimentação
            this.friction = 0.001;
            this.maxVelocity = 6;
            this.acceleration = 0;
            this.velocity = 0;

            ballsArray.push(this);
        }

        /**
         * Movimenta o objeto
         */
        move() {
            this.velocity += this.acceleration;

            this.velocity = constrain(
                this.velocity, -this.maxVelocity, this.maxVelocity);

            this.pos.y += this.velocity;
            this.acceleration = 0;
        }

        /**
         * Aplica força contrária ao movimento
         */
        applyFriction() {
            this.velocity += -this.velocity * this.friction;
        }

        /**
         * Desenha o objeto na tela
         */
        draw() {
            p.fill(255, 0, 0);
            p.ellipse(this.pos.x, this.pos.y, this.Size, this.Size);
        }

        /**
         * Aplica determinada força à partícula
         * @param {number} f Intensidade da força
         */
        applyForce(f) {
            if (this.inLiquid) {
                f = f / 3;
            }
            this.acceleration = f;
        }

        /**
         * Verifica colisão com a água
         */
        checkCollision() {
            if (this.firstContact) {
                for (var i = 0; i < wavesArray.length; i++) {
                    if (this.pos.y + this.Size / 2 > p.height - wavesArray[i].height) {
                        if (this.pos.x <= wavesArray[i].pos.x + WAVE_WIDTH &&
                            this.pos.x >= wavesArray[i].pos.x) {

                                // Se colidiu, aplicar força
                            this.inLiquid = true;
                            wavesArray[i].applyForce(this.mass);
                            wavesArray[i].spread();
                            wavesArray[i].spreading = true;
                            this.barId = i;
                            break;
                        }
                    }
                }
            }
        }

        /**
         * Faz o objeto boiar na água.
         */
        float() {
            if (p.abs(this.pos.y - (p.height - wavesArray[this.barId].height)) < 3) {
                if (p.abs(this.velocity) < 1 &&
                    this.velocity < 0) {
                    this.pos.y = p.height - wavesArray[this.barId].height;
                }
            }
        }

        /**
         * Função principal que controla todas as outras
         */
        run() {
            if (this.pos.y < p.height + this.Size) {
                this.draw();
                if (!this.inLiquid) {
                    this.checkCollision();
                } else {
                    //this.float();
                    if (!this.enteredLiquid) {
                        this.enteredLiquid = true;
                        this.friction = 0.05;
                    }
                }
                if (this.acceleration !== 0) {
                    this.move();
                    this.applyFriction();
                }
            } else {
                this.isDead = true;
            }
        }
    }

    /**
     * Preenche as arrays das ondas
     * aux = ondas da frente, que interagem
     * aux2 = ondas de trás, plano de fundo
     */
    for (var i = 0; i < p.width / WAVE_WIDTH; i++) {
        var aux = new WaveParticle(i * WAVE_WIDTH);
        var aux2 = new WaveParticle(i * WAVE_WIDTH);

        aux2.id = i;
        aux2.bgColor = p.color(2, 89, 194);
        aux2.isBackground = true;
        aux.id = i;

        wavesArray.push(aux);
        bgWavesArray.push(aux2);
    }

    var shipImage = p.loadImage("barco.png");
    var barInd = 30;

    var gravity = 0.1;

    // TEMPO
    {
        p.noStroke();
        var leftX = 100;
        var rightX = 310;

        var ceuAzul = p.color(184, 236, 255);
        var ceuCinza = p.color(161, 158, 161);
        var ceu;
        var tempoCeu = 0;
    }

    p.draw = function () {
        // TEMPO
        ceu = p.lerpColor(ceuCinza, ceuAzul, tempoCeu);
        if (tempoCeu < 1) {
            tempoCeu += 0.004;
            leftX -= 0.8;
            rightX += 0.8;
        }
        p.background(ceu);

        // clouds 
        p.fill(255, 255, 255);
        // left cloud
        p.ellipse(leftX, 150, 126, 97);
        p.ellipse(leftX + 62, 150, 70, 60);
        p.ellipse(leftX - 62, 150, 70, 60);

        // right cloud
        p.ellipse(rightX, 100, 126, 97);
        p.ellipse(rightX + 62, 100, 70, 60);
        p.ellipse(rightX - 62, 100, 70, 60);


        // Contador da bola
        if (ballTimer > 0) {
            ballTimer--;
        }

        // Faz funcionar as ondas
        for (var i = 0; i < wavesArray.length; i++) {
            bgWavesArray[i].run();
            wavesArray[i].run();
        }

        // Faz funcionar as bolas
        for (var i = ballsArray.length - 1; i >= 0; i--) {
            var ball = ballsArray[i];
            ball.applyForce(gravity);
            ball.run();
            if (ball.isDead) {
                ballsArray.splice(i, 1);
            }
        }

        // Desenha o barco na tela
        p.pushMatrix();
        p.imageMode(p.CENTER);
        p.image(shipImage,
            wavesArray[barInd].pos.x, p.height - wavesArray[barInd].height,
            70, 70);
        p.popMatrix();
    };

    // Verifica interação com o mouse
    p.mouseClicked = function () {
        if (p.mouseButton !== p.LEFT) {
            return;
        }
        if (ballTimer === 0 &&
            p.mouseY < p.height - WATER_LEVEL - 50) {
            new Ball(p.mouseX, p.mouseY, ballMass);
            ballTimer = ballRecoveryTime;
        }
    };

    // Verifica interação com o teclado
    p.keyPressed = function () {
        var val = p.keyCode - 48;
        if (val > 0 && val < 6) {
            ballMass = val;
        }
    };



}