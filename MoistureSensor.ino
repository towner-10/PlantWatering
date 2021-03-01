int analogPin = 0;
int val;

void setup() {
  Serial.begin(9600);
}

void loop() {
  val = analogRead(analogPin);
  val = map(val, 550, 10, 0, 100);
  Serial.println(val);
  delay(1000);
}
