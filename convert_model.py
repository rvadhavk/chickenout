import tensorflowjs as tfjs
from model import CreateModel

model = CreateModel()
model.load_weights('model.h5')
tfjs.converters.save_keras_model(model, 'extension/model')
