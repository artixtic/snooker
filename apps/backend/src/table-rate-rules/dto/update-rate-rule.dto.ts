import { PartialType } from '@nestjs/mapped-types';
import { CreateRateRuleDto } from './create-rate-rule.dto';

export class UpdateRateRuleDto extends PartialType(CreateRateRuleDto) {}

