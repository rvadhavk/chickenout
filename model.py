from keras.applications.mobilenet import MobileNet
from keras.layers import Dense, Dropout, GlobalAveragePooling2D, Reshape
from keras.models import Model
import tensorflowjs as tfjs

ALPHA = 0.75
DROPOUT = 1e-3

base_model = MobileNet(input_shape=(128,128,3), alpha=ALPHA, include_top=False)
for layer in base_model.layers:
  layer.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Reshape((int(1024 * ALPHA),), name='reshape_1')(x)
x = Dropout(DROPOUT, name='dropout')(x)
output = Dense(1, activation='sigmoid')(x)
model = Model(inputs=base_model.input, outputs=output)
model.compile(optimizer='rmsprop', loss='binary_crossentropy')
tfjs.converters.save_keras_model(model, 'extension/model')

