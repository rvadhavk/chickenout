import keras
import tensorflowjs as tfjs

model = keras.applications.mobilenet.MobileNet()
tfjs.converters.save_keras_model(model, 'extension/model')

