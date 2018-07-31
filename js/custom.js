function main(p) {

    { // Setup
        p.size(600, 600);
        p.frameRate(60);
    }

    var BAR_WIDTH = 5;
    var WATER_LEVEL = 200;
 
    var bars = [];
    var bars2 = [];
    var balls = [];

    var ballMass = 1;

    var ballTimer = 0;
    var ballRecoveryTime = 90;


    class Bar {
        constructor(x) {
            this.id = 0;
            this.pos = new PVector(x, p.height);
            this.h = WATER_LEVEL;
            this.w = BAR_WIDTH;
            this.bgColor = p.color(20, 113, 227);
            this.isBackground = false;
            this.forceDecay = 0.9;
            this.friction = 0.003;
            this.counter = 0;
            this.counting = false;
            this.spreading = false;
            this.nid = this.id + 1;
            this.pid = this.id - 1;
            this.acceleration = 0;
            this.lastAcceleration = 0;
            this.velocity = 0;
        }

        draw() {
            p.fill(this.bgColor);
            p.noStroke();
            var posY = -this.h;
            if (this.isBackground) {
                if (this.id > 60) {
                    posY += p.cos(this.counter + this.id * 6.1) * 5;
                } else {
                    posY += p.cos(this.counter + this.id * 6.2) * 5;
                }
            }
            p.rect(this.pos.x, this.pos.y, this.w, posY);
        }

        applyForce(f) {
            this.acceleration += f;
            this.lastAcceleration = f;
            this.counter = 0;
            this.counting = true;
            this.nid = this.id + 1;
            this.pid = this.id - 1;
        }

        setMotion() {
            this.velocity += this.acceleration;
            this.h += -this.velocity * p.cos(this.counter * 2);
            this.acceleration = 0;
        }

        spread() {
            this.lastAcceleration *= 0.999;
            var f = this.lastAcceleration;
            var a = false;
            var b = false;
            if (this.counter % 4 < this.lastAcceleration * 3) {
                if (this.nid < bars.length) {
                    bars[this.nid++].applyForce(f);
                } else {
                    a = true;
                }
                if (this.pid >= 0) {
                    bars[this.pid--].applyForce(f);
                } else {
                    b = true;
                }
                if (a && b) {
                    this.spreading = false;
                }
            }
        }

        applyFriction() {
            this.velocity += -this.velocity * this.friction;
        }

        run() {
            this.draw();
            this.counter += 0.02;
            if (this.counting) {
                this.setMotion();
                this.applyFriction();
                if (this.h < WATER_LEVEL) {
                    this.h += 0.1;
                } else if (this.h > WATER_LEVEL) {
                    this.h -= 0.1;
                }
                if (this.velocity < 0.05) {
                    if (p.abs(this.h - WATER_LEVEL) < 2) {
                        this.h = WATER_LEVEL;
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


    class Ball {
        constructor(x, y, m) {
            this.pos = new PVector(x, y);
            this.m = m || 1;
            this.barId = -1;
            this.Size = 15 + this.m * 5;
            this.inLiquid = false;
            this.enteredLiquid = false;
            this.friction = 0.001;
            this.maxVelocity = 6;
            this.acceleration = 0;
            this.velocity = 0;
            this.firstContact = true;
            balls.push(this);
        }
        move() {
            this.velocity += this.acceleration;
            if (this.velocity > this.maxVelocity) {
                this.velocity = this.maxVelocity;
            } else if (this.velocity < -this.maxVelocity) {
                this.velocity = -this.maxVelocity;
            }
            this.pos.y += this.velocity;
            this.acceleration = 0;
        }
        applyFriction() {
            this.velocity += -this.velocity * this.friction;
        }

        draw() {
            p.fill(255, 0, 0);
            p.ellipse(this.pos.x, this.pos.y, this.Size, this.Size);
        }

        applyForce(f) {
            if (this.inLiquid) {
                f = f / 3;
            }
            this.acceleration = f;
        }

        checkCollision() {
            if (this.firstContact) {
                for (var i = 0; i < bars.length; i++) {
                    if (this.pos.y + this.Size / 2 > p.height - bars[i].h) {
                        if (this.pos.x <= bars[i].pos.x + BAR_WIDTH &&
                            this.pos.x >= bars[i].pos.x) {
                            this.inLiquid = true;
                            bars[i].applyForce(this.m);
                            bars[i].spread();
                            bars[i].spreading = true;
                            this.barId = i;
                            break;
                        }
                    }
                }
            }
        }

        float() {
            if (p.abs(this.pos.y - (p.height - bars[this.barId].h)) < 3) {
                if (p.abs(this.velocity) < 1 &&
                    this.velocity < 0) {
                    this.pos.y = p.height - bars[this.barId].h;
                }
            }
        }

        run() {
            if (this.pos.y < p.height + this.Size) {
                this.draw();
                if (!this.inLiquid) {
                    this.checkCollision();
                } else {
                    this.float();
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

    for (var i = 0; i < p.width / BAR_WIDTH; i++) {
        var aux = new Bar(i * BAR_WIDTH);
        var aux2 = new Bar(i * BAR_WIDTH);

        aux2.id = i;
        aux2.bgColor = p.color(2, 89, 194);
        aux2.isBackground = true;
        aux.id = i;
        bars.push(aux);
        bars2.push(aux2);
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

        // AGUA

        if (ballTimer > 0) {
            ballTimer--;
        }

        for (var i = 0; i < bars.length; i++) {
            bars2[i].run();
            bars[i].run();
        }

        for (var i = balls.length - 1; i >= 0; i--) {
            var ball = balls[i];
            ball.applyForce(gravity);
            ball.run();
            if (ball.isDead) {
                balls.splice(i, 1);
            }
        }

        p.pushMatrix();        
        p.imageMode(p.CENTER);
        p.image(shipImage,
            bars[barInd].pos.x, p.height - bars[barInd].h,
        50, 50);
        p.popMatrix();


        p.color(255);
    };

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

    p.keyPressed = function () {
        var val = p.keyCode - 48;
        if (val > 0 && val < 6) {
            ballMass = val;
        }
    };



}