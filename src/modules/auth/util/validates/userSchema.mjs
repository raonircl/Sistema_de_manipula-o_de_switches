import Joi from 'joi';

const userSchema = Joi.object({
    name: Joi.string()
        .pattern(/^[A-Za-zÀ-ÿ\s]+$/)
        .max(50)
        .min(2)
        .required()
        .messages({
            'string.pattern.base': 'O nome deve conter apenas letras e espaços.',
            'string.empty': 'O nome não pode estar vazio.',
            'string.max': 'O nome deve ter no máximo 100 caracteres.',
            'string.min': 'O nome deve ter no mínimo 2 letras.',
        }),
    email: Joi.string()
        .email()
        .max(50)
        .required()
        .messages({
            'string.email': 'Por favor, forneça um e-mail válido.',
            'string.empty': 'O e-mail não pode estar vazio.',
            'string.max': 'O e-mail deve ter no máximo 100 caracteres.',
        }),
    password: Joi.string()
        .min(6)
        .max(30)
        .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/)
        .required()
        .messages({
            'string.pattern.base': 'A senha deve conter pelo menos uma letra maiúscula e um caractere especial.',
            'string.min': 'A senha deve ter no mínimo 6 caracteres.',
            'string.max': 'A senha deve ter no máximo 30 caracteres.',
            'string.empty': 'A senha não pode estar vazia.',
        }),
});

export default userSchema;